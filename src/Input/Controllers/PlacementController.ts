import { Application } from '../../Application'
import fs from 'fs'
import { AbstractController } from '../../Base/Controllers/AbstractController'
import { Request, Response} from 'express'
import { IItemData } from '../Services/BufferMatrix'


export class PlacementController extends AbstractController {

    constructor(protected app: Application) {
        super(app)
        app.http.get('/', (req:Request, res: Response) => {
            res.send(fs.readFileSync('dist/index.html').toString())
        })
        app.http.get('/api/buffer', (req, res) => {
            return this.successResponse(res, { result: this.app.bufferMatrix.getNewComm() })
        })
    }
 }