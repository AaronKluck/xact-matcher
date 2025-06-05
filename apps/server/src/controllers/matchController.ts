import { Request, Response, NextFunction } from 'express';


const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
        fn(req, res, next).catch(next);
    };



export const matchOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {

});
