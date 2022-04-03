import {
  getExpectedRevisionFromETag,
  sendCreated,
  toWeakETag,
} from '#core/http';
import { assertNotEmptyString, assertPositiveNumber } from '#core/validation';
import { create, update } from '#eventsourced/core/commandHandling';
import { getEventStore } from '#eventsourced/core/streams';
import { NextFunction, Request, Response, Router } from 'express';
import { v4 as uuid } from 'uuid';
import {
  addProductItemToShoppingCart,
  confirmShoppingCart,
  openShoppingCart,
  removeProductItemFromShoppingCart,
  toShoppingCartStreamName,
} from './shoppingCart';

//////////////////////////////////////
/// Routes
//////////////////////////////////////

export const router = Router();

// Open Shopping cart
router.post(
  '/clients/:clientId/shopping-carts/',
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const shoppingCartId = request.body.sessionId ?? uuid();
      const streamName = toShoppingCartStreamName(shoppingCartId);

      const result = await create(getEventStore(), openShoppingCart)(
        streamName,
        {
          shoppingCartId,
          clientId: assertNotEmptyString(request.params.clientId),
        }
      );

      response.set('ETag', toWeakETag(result.nextExpectedRevision));
      sendCreated(response, shoppingCartId);
    } catch (error) {
      next(error);
    }
  }
);

// TODO: Add Pattern matching here

// Add Product Item
router.post(
  '/clients/:clientId/shopping-carts/:shoppingCartId/product-items',
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const shoppingCartId = assertNotEmptyString(
        request.params.shoppingCartId
      );
      const streamName = toShoppingCartStreamName(shoppingCartId);
      const expectedRevision = getExpectedRevisionFromETag(request);

      const result = await update(
        getEventStore(),
        addProductItemToShoppingCart
      )(
        streamName,
        {
          shoppingCartId: assertNotEmptyString(request.params.shoppingCartId),
          productItem: {
            productId: assertPositiveNumber(request.body.productId),
            quantity: assertPositiveNumber(request.body.quantity),
          },
        },
        expectedRevision
      );

      response.set('ETag', toWeakETag(result.nextExpectedRevision));
      response.sendStatus(200);
    } catch (error) {
      next(error);
    }
  }
);

// Remove Product Item
router.delete(
  '/clients/:clientId/shopping-carts/:shoppingCartId/product-items',
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const shoppingCartId = assertNotEmptyString(
        request.params.shoppingCartId
      );
      const streamName = toShoppingCartStreamName(shoppingCartId);
      const expectedRevision = getExpectedRevisionFromETag(request);

      const result = await update(
        getEventStore(),
        removeProductItemFromShoppingCart
      )(
        streamName,
        {
          shoppingCartId: assertNotEmptyString(request.params.shoppingCartId),
          productItem: {
            productId: assertPositiveNumber(request.body.productId),
            quantity: assertPositiveNumber(request.body.quantity),
          },
        },
        expectedRevision
      );

      response.set('ETag', toWeakETag(result.nextExpectedRevision));
      response.sendStatus(200);
    } catch (error) {
      next(error);
    }
  }
);

// Confirm Shopping Cart
router.put(
  '/clients/:clientId/shopping-carts/:shoppingCartId',
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      const shoppingCartId = assertNotEmptyString(
        request.params.shoppingCartId
      );
      const streamName = toShoppingCartStreamName(shoppingCartId);
      const expectedRevision = getExpectedRevisionFromETag(request);

      const result = await update(getEventStore(), confirmShoppingCart)(
        streamName,
        {
          shoppingCartId: assertNotEmptyString(request.params.shoppingCartId),
        },
        expectedRevision
      );

      response.set('ETag', toWeakETag(result.nextExpectedRevision));
      response.sendStatus(200);
    } catch (error) {
      next(error);
    }
  }
);

// router.get(
//   '/clients/:clientId/shopping-carts/:shoppingCartId',
//   async (request: Request, response: Response, next: NextFunction) => {
//     try {
//       const collection = await getShoppingCarts();

//       const result = await collection.findOne({
//         shoppingCartId: assertNotEmptyString(request.params.shoppingCartId),
//       });

//       if (result === null) {
//         response.sendStatus(404);
//         return;
//       }

//       response.set('ETag', toWeakETag(result.revision));
//       response.send(result);
//     } catch (error) {
//       next(error);
//     }
//   }
// );