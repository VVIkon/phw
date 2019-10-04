import {Application} from '../Application'
import { AbstractService } from '../Base/Service/AbstractService';

export class LogApp extends AbstractService{
    private node_env: string

    constructor(app: Application) {
        super(app)    
        this.node_env = app.config.node_env
    }

    log(msg: string, params: string = '') {
        if (this.node_env == 'develop') {
        console.log(msg, params)
        }
    }

}