import { Application } from '../Application'
import { TwingLoaderFilesystem , TwingEnvironment } from 'twing'

export class TemplateService {  
    public loader: any
    public twig: any
 
    /** @param {Application} app */
    constructor(protected app: Application) {
      this.loader = new TwingLoaderFilesystem('src')
      this.twig = new TwingEnvironment(this.loader)
    }

    async render(template: string, parameters = {}) {
        return this.twig.render(template, parameters)
    }

}