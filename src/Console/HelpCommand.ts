import { AbstractConsoleCommand } from '../Base/Console/AbstractConsoleCommand'
import { Application } from '../Application'

export class HelpCommand extends AbstractConsoleCommand {

    public constructor(app: Application) {
        super(app, '--help', 'Show this help')
    }

    public async execute(): Promise<void> {
        console.log('\n=== Available commands: ===')
        const commands: AbstractConsoleCommand[] = Object.keys(this.app)
            .map(k => (this.app as any)[k]).filter(f => f instanceof AbstractConsoleCommand)
            .sort((a: AbstractConsoleCommand, b: AbstractConsoleCommand) => a.command.toLowerCase() < b.command.toLowerCase() ? -1 : 1)
        const maxLength = Math.max(...commands.map(c => c.command.length))

        for (const commandInstance of commands) {
            console.log(`    ${commandInstance.command.padEnd(maxLength)} - ${commandInstance.description}`)
        }
    }

}
