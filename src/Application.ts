import express, { Express }  from 'express'
import fs from 'fs'
import { LogApp } from './Logs/LogApp'
import { TcpServer } from './Input/Services/TcpServer'
import { DbService } from './Base/Service/DbService'
import { ScanService } from './Base/Service/ScanService'
import { BufferMatrix } from './Input/Services/BufferMatrix'
import { PlacementController } from './Input/Controllers/PlacementController'
import { AbstractConsoleCommand } from './Base/Console/AbstractConsoleCommand'
import { MailTestConsoleCommand } from './Console/MailTestConsoleCommand'
import { HelpCommand } from './Console/HelpCommand'


export interface IConfig {
    node_env: string //'develop'|'production'
    tcpPort: number
    httpPort: number
    host: string
    db: {
        host: string
        name: string
        user: string
        password: string
    },
    mail: {
        host: string
        port:number
        secure: boolean
        user: string
        password: string
        sender: string
    },
    expareMacPool: number   // Интервал устарения мас-адресов (30 сек = 30000, 0-не сохранять)
    newCoomSize: number     // накопление 10 записей 
    netMasc: string         // Подсеть (при замене 'Ip_')
    savePoolInterval: number// интервал сохранения в БД изменённого МАС (1 сек, 0-не сохранять)
    deadRouterInterval: number // интервал после которого считаем роутер повисшим (1 мин, 0-не сохранять)
    mailSendDeadRouterInterval: number // интервал рассылки уведомлений о повисших роутерах (20 мин, 0-не отсылать)
    macBlackList: string[]
}

export class Application {
    public http!: Express
    public blackList: any[]
    public mode: 'command'|'server'

    // Services
    public dbService!: DbService
    public logApp!: LogApp
    public scanService!: ScanService
    public bufferMatrix!: BufferMatrix
    public tcpServer!: TcpServer
    // Controllers
    public placementController!: PlacementController
    // Commands
    public mailTestConsoleCommand!: MailTestConsoleCommand
    public helpCommand!: HelpCommand



    constructor(public readonly config: IConfig) { 
        this.mode = 'server'
        this.blackList = config.macBlackList
    }

    get isConsole() {
        return !!process.argv[2]
    }
    

    public async run() {
        this.initializeServices()

        if (this.isConsole) {
            this.mode = 'command'
            this.runConsole()
        } else {
            this.mode = 'server'
            this.runHttpServer()
        }
    }

    public async runConsole() {
        const command = process.argv[2]
        this.initializeConsoleCommands()
        for (const commandInstance of Object.values(this)) {
            if (commandInstance instanceof AbstractConsoleCommand) {
                if (commandInstance.command === command) {
                    await commandInstance.execute()
                    process.exit()
                }
            }
        }
        console.log(`Command "${command}" not found`)
        process.exit()
    }

    public runHttpServer() {
        this.http = express()
        this.http.use(express.json())
        this.http.use(express.static('front/dist', { index: false }))
        
        this.http.use(async (req: any , res: any , next: any ) => {
            if (req.url.indexOf('/api/') === -1) {
                res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
                res.header('Expires', '-1')
                res.header('Pragma', 'no-cache')
                res.send(fs.readFileSync('front/dist/index.html').toString())
            } else {
                next()
            }
        })

        this.initializeControllers()

        this.http.listen(this.config.httpPort, () => {
            console.log(`We are listening on ${this.config.httpPort}`)
        })
    }

    public initializeConsoleCommands() {
        this.mailTestConsoleCommand = new MailTestConsoleCommand(this)
        this.helpCommand = new HelpCommand(this)
    }

    public initializeServices() {
        this.dbService = new DbService(this)
        this.logApp = new LogApp(this)
        this.scanService = new ScanService(this)
        this.bufferMatrix = new BufferMatrix(this)
        this.tcpServer = new TcpServer(this)
    }
    
    public initializeControllers() {
        this.placementController = new PlacementController(this)
    }


}
