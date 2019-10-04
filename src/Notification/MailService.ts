import { Application } from '../Application'
import  Nodemailer  from 'nodemailer'

export class MailService {
    public transporter: any
    constructor(protected app: Application) {
        this.transporter = Nodemailer.createTransport({
        host: this.app.config.mail.host,
        port: this.app.config.mail.port,
        secure: this.app.config.mail.secure,
        debug: true,
        auth: {
            user: this.app.config.mail.user,
            pass: this.app.config.mail.password,
        },
            tls: {
            rejectUnauthorized: false
            }
        });
    }
    /**
     * Почта посылатель
     * @param {
            from: sender,
            to: toMail,
            html: msg
        } params 
    */
    public async send(params: any): Promise<void> {
        return new Promise((resolve, reject) => {
            params['subject'] = 'PISK service message'
            this.transporter.sendMail( params, (error: any, info: any) => {
                if(error){
                    reject(error)
                }else{
                    resolve(info.messageId)
                }
            })
        })  
    }
}