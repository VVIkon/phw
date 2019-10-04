import { Application } from '../../Application'
import { Request, Response } from 'express'

export class AbstractController {

    constructor(protected app: Application) { }

    async successResponse(res: Response, data = {}) {
        res.send({
            success: true,
            errorMessage: '',
            ...data
        })
    }

    async errorResponse(res: Response, errorMessage: string , data: any = {}) {
        res.send({
            success: false,
            errorMessage: errorMessage,
            ...data
        })
    }

    static errorResponseStatic(res: Response, errorMessage: string) {
        res.send({
            error: true,
            errorMessage: ''
        })
    }
}