import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const admin = await getAuthenticatedAdmin(request);
    if (!admin || !hasPermission(admin, 'orders.edit')) {
      return NextResponse.json({ error: 'Accès non autorisé.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      action, // 'ADD_ITEM' | 'MARK_RECEIVED' | 'INSPECT'
      returnItemId,
      productName,
      productId,
      sku,
      quantity = 1,
      inspectionDecision, // 'RESTOCK_SELLABLE' | 'DAMAGED_DISCARD' | 'NOT_RESALEABLE' | 'OTHER_JUSTIFIED'
      inspectionNotes,
    } = body;

    const claim = await prisma.claimTicket.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Dossier SAV introuvable.' }, { status: 404 });
    }

    if (action === 'ADD_ITEM') {
      if (!productName) {
        return NextResponse.json({ error: 'Le nom du produit est requis.' }, { status: 400 });
      }

      const item = await prisma.$transaction(async (tx) => {
        const retItem = await tx.claimReturnItem.create({
          data: {
            claimId: id,
            productName: productName.trim(),
            productId: productId ? Number(productId) : null,
            sku: sku || null,
            quantity: Number(quantity) || 1,
            status: 'RETURN_REQUESTED',
          },
        });

        await tx.claimEvent.create({
          data: {
            claimId: id,
            actorId: admin.id,
            actorName: admin.name,
            actorRole: admin.role,
            type: 'RETURN_STATUS_CHANGE',
            title: `Retour demandé : ${retItem.productName} (x${retItem.quantity})`,
            description: 'Article ajouté à la liste des retours de colis attendus.',
          },
        });

        return retItem;
      });

      return NextResponse.json({ success: true, item, message: 'Article retourné enregistré.' });
    }

    if (action === 'MARK_RECEIVED') {
      if (!returnItemId) {
        return NextResponse.json({ error: 'ID de l\'article requis.' }, { status: 400 });
      }

      const existingItem = await prisma.claimReturnItem.findUnique({ where: { id: returnItemId } });
      if (!existingItem || existingItem.claimId !== id) {
        return NextResponse.json({ error: 'Article introuvable dans ce dossier.' }, { status: 404 });
      }

      const updatedItem = await prisma.$transaction(async (tx) => {
        const item = await tx.claimReturnItem.update({
          where: { id: returnItemId },
          data: {
            status: 'RETURN_RECEIVED',
            updatedAt: new Date(),
          },
        });

        await tx.claimEvent.create({
          data: {
            claimId: id,
            actorId: admin.id,
            actorName: admin.name,
            actorRole: admin.role,
            type: 'RETURN_STATUS_CHANGE',
            title: `Colis retour réceptionné : ${item.productName} (x${item.quantity})`,
            description: 'Le produit a été réceptionné et placé en quarantaine pour contrôle qualité.',
          },
        });

        return item;
      });

      return NextResponse.json({ success: true, item: updatedItem, message: 'Colis retour marqué comme réceptionné.' });
    }

    if (action === 'INSPECT') {
      if (!returnItemId || !inspectionDecision) {
        return NextResponse.json({ error: 'Décision d\'inspection requise.' }, { status: 400 });
      }

      const existingItem = await prisma.claimReturnItem.findUnique({ where: { id: returnItemId } });
      if (!existingItem || existingItem.claimId !== id) {
        return NextResponse.json({ error: 'Article introuvable dans ce dossier.' }, { status: 404 });
      }

      const updatedItem = await prisma.$transaction(async (tx) => {
        let isRestocked = existingItem.isRestocked;
        let restockedAt = existingItem.restockedAt;
        let restockedQuantity = existingItem.restockedQuantity;
        let restockedById = existingItem.restockedById;
        let restockedByName = existingItem.restockedByName;

        // If Restock is chosen and hasn't been restocked yet
        if (inspectionDecision === 'RESTOCK_SELLABLE') {
          if (existingItem.isRestocked) {
            throw new Error('Cet article a déjà été réintégré dans le stock.');
          }

          // Check permissions for restock
          if (!hasPermission(admin, 'inventory.adjust') && !hasPermission(admin, 'orders.edit')) {
            throw new Error('Vous n\'avez pas la permission de réintégrer des articles en stock.');
          }

          let matchedProduct: any = null;
          if (existingItem.productId) {
            matchedProduct = await tx.product.findUnique({ where: { id: existingItem.productId } });
          } else if (existingItem.sku) {
            matchedProduct = await tx.product.findFirst({ where: { sku: existingItem.sku } });
          } else if (existingItem.productName) {
            matchedProduct = await tx.product.findFirst({
              where: { name: { contains: existingItem.productName, mode: 'insensitive' } },
            });
          }

          if (matchedProduct) {
            await tx.product.update({
              where: { id: matchedProduct.id },
              data: {
                stock: { increment: existingItem.quantity },
                inStock: true,
              },
            });
          }

          isRestocked = true;
          restockedAt = new Date();
          restockedQuantity = existingItem.quantity;
          restockedById = admin.id;
          restockedByName = admin.name;
        }

        const item = await tx.claimReturnItem.update({
          where: { id: returnItemId },
          data: {
            status: 'INSPECTED',
            inspectionDecision,
            inspectionNotes: inspectionNotes ? inspectionNotes.trim() : null,
            inspectedAt: new Date(),
            inspectedById: admin.id,
            inspectedByName: admin.name,
            isRestocked,
            restockedAt,
            restockedQuantity,
            restockedById,
            restockedByName,
          },
        });

        const decisionLabels: Record<string, string> = {
          RESTOCK_SELLABLE: 'Remise en stock vendable (+ stock)',
          DAMAGED_DISCARD: 'Produit endommagé / mis au rebut',
          NOT_RESALEABLE: 'Non revendable / ouvert',
          OTHER_JUSTIFIED: 'Autre disposition validée',
        };

        await tx.claimEvent.create({
          data: {
            claimId: id,
            actorId: admin.id,
            actorName: admin.name,
            actorRole: admin.role,
            type: inspectionDecision === 'RESTOCK_SELLABLE' ? 'RESTOCK_EXECUTED' : 'RETURN_STATUS_CHANGE',
            title: `Contrôle qualité : ${decisionLabels[inspectionDecision] || inspectionDecision}`,
            description: `Produit: ${item.productName} (x${item.quantity}). ${inspectionNotes ? `Notes: "${inspectionNotes}"` : ''}`,
            metadata: JSON.stringify({
              returnItemId,
              decision: inspectionDecision,
              isRestocked,
              restockedQuantity,
            }),
          },
        });

        await tx.adminActivityLog.create({
          data: {
            userId: admin.id,
            userName: admin.name,
            userEmail: admin.email,
            action: 'INSPECT_SAV_RETURN',
            entityType: 'ORDER',
            entityId: claim.orderId,
            description: `Inspection SAV ${claim.ticketNumber}: ${item.productName} -> ${decisionLabels[inspectionDecision]}`,
          },
        });

        return item;
      });

      return NextResponse.json({ success: true, item: updatedItem, message: 'Inspection enregistrée avec succès.' });
    }

    return NextResponse.json({ error: 'Action non reconnue.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error handling SAV return item:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors du traitement du retour.' }, { status: 500 });
  }
}
