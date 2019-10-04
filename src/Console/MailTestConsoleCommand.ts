import { Application } from '../Application'
import { AbstractConsoleCommand } from '../Base/Console/AbstractConsoleCommand'

export class MailTestConsoleCommand extends AbstractConsoleCommand {

    constructor(protected app: Application) {
        super(app, 'mail:test', 'Тест отсылки почты')
    }

    public async execute(): Promise < void > {
        const params = {
            from: this.app.config.mail.sender,
            to: 'admin@mail.ru',
            subject: 'phw',
            html: 'test message sent from PHW'
        }
        try {
            // const msgId = await this.app.mailService.send(params)
            console.log('Message sent id: ' + JSON.stringify(params, null, 4))
        } catch (err) {
            console.log(err)
        }
    }
}