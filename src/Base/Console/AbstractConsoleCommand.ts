import { Application } from '../../Application'

export abstract class AbstractConsoleCommand {
    constructor(protected app: Application, public readonly command: string, public readonly description: string) {}
    public abstract async execute(): Promise < void >
}