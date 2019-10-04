import { Application } from '../../Application'
import { AbstractService } from '../../Base/Service/AbstractService';
import { IBufferData } from './BufferMatrix'
import  net, {Socket } from 'net'


export class TcpServer extends AbstractService {

    constructor(app: Application) {
        super(app)

        try {
            const tcpServer = net.createServer(( socket: Socket ) => {
                socket.setTimeout(0) //Не использовать Timeouts
                socket.on('data', async(data: Buffer) => {
                    try {
                        this.putToBuffer(data, socket.remoteAddress ? socket.remoteAddress : '')
                        const wl = await this.app.bufferMatrix.getWhiteMacList()
                        this.app.logApp.log(`wl: ${wl} send to router IP: ${socket.remoteAddress ? socket.remoteAddress : ''} `)
                        socket.write(wl.toString()) // answer WhiteList
                        socket.pipe(socket)
                        socket.end()
                    } catch (e) {
                        this.app.logApp.log(`!!! Ошибка данных: ${data.toString()}`)
                    }
                })
                socket.on('end', async () => {
                    await this.app.bufferMatrix.startProcess()
                    this.app.logApp.log('TCP server disconnect.')
                    tcpServer.getConnections((err, count) => {
                        if (!err) {
                            this.app.logApp.log('There are %d connections now. ', count.toString() ) 
                        } else {
                            console.error(`!!! Ошибка соединения: ${JSON.stringify(err)}`)
                        }
                    })
                })
                socket.on('error', (e) => {
                    this.app.logApp.log(`!!! Ошибка сервера: ${JSON.stringify(e)} при обработки роутера IP: ${socket.remoteAddress} `)
                })
            }).listen(app.config.tcpPort, () => {
                let d = new Date()
                let i = new Date((new Date(d)).toISOString())
                let f = new Date(i.getTime() - (d.getTimezoneOffset() * 60000))
                console.log(`************ ${f.toJSON().slice(0,19).replace(/T/g,' ').replace(/-/g,'.')}************`)
                console.log('TCP server sniff port : ' + app.config.tcpPort)

                tcpServer.on('close', () => {
                    this.app.logApp.log('TCP server closed.')
                })
                tcpServer.on('error', (error) => {
                    this.app.logApp.log(`!!! Ошибка tcp сервера: ${JSON.stringify(error)}`)
                })
            })
        } catch (e) {
            console.log(`Ошибка: ${e}`)
        }
    }

    private async putToBuffer(data: Buffer, ipRouter: string): Promise<void> {
        let retData = JSON.parse(data.toString())
        const bufferData: IBufferData = {
            date: (new Date()).getTime(),
            ip: ipRouter.substring(7),
            mac: retData.mac,  
            signal: Number(retData.signal),
        }        
        try {
            await this.app.bufferMatrix.putToNewCommBuffer(bufferData)
            console.log('to buffer:' + JSON.stringify(bufferData))
        } catch (err) {
            console.log('Error: ' + err, JSON.stringify(bufferData))
        }
    }
}