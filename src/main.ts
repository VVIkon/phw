import {IConfig, Application } from './Application'

export function execute(config: IConfig) {
    const app = new Application(config)
    app.run()
}
