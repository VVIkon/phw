import { Application } from '../../Application'
import { AbstractService } from '../../Base/Service/AbstractService';

interface IWhaitList {
    version: number, 
    list: string[] 
}

export interface IBufferData{
    date: number, 
    ip: string,  
    mac: string,  
    signal: number,
}

export interface IMacOwner {
    id: number, 
    userId: number, 
    uName: string, 
    active: number,
    departId: Number
}

export interface IHostData {
    ip: string,     // '172.22.94.1'
    signal: number, //-84, 
    date: number,    // 2354234234234 
}

export interface IItemData {
    mac: string,
    macOwner: IMacOwner|undefined, // Добавляется при отображении
    hosts: IHostData[], 
    // modified: boolean  // true: флаг показывающий изменённость сигнала в одном из хостов
}
/**
 *  newComm - Входной буфер
 *  macPool - Пул mac-адресов
 *  lastSaveToDB - Дата последнего сохранения данных в БД
 *  ipList - Объект хранит время последней передачи данных {ip_22:15345699473854}
 *  whiteMacList - объект обновления списка МАС - адресов по которым шлются данные. Передаётся в роутер
 */

 export class BufferMatrix extends AbstractService {
    private newComm: IBufferData[]
    macPool: IItemData[]  
    private lastSaveToDB: number
    private ipList: {[key: string]: number}
    private whiteMacList: IWhaitList
    private routers: IHostData[]

    constructor(app: Application) {
        super(app)
        this.newComm = []
        this.macPool = []
        this.lastSaveToDB = 0 
        this.ipList = {}
        this.whiteMacList = { version: 0, list: [] } 
        this.routers = [
            {ip: '172.22.36.56',  signal: -100, date: 1500000000 },
            {ip: '172.22.36.58',  signal: -100, date: 1500000000},
            {ip: '172.22.36.19',  signal: -100, date: 1500000000},
            {ip: '172.22.36.26',  signal: -100, date: 1500000000},
        ]
        this.init()
    }
    
    /**
     * Добавление новых пакетов в буфер (в начало стека)
     */
    public async putToNewCommBuffer(data: IBufferData): Promise<void> {
        if (this.app.blackList.indexOf(data.mac) == -1) {
            this.newComm.unshift(data)
        }
    }
    
    /**
     * По зарегистрированным роутерам составляется структура:
     */
    public async addStructure(macAddres: string ): Promise<IItemData|undefined> {
        const hostsStructure: IHostData[] = []
        for (const router of this.routers) {
            let host: IHostData = {
                ip: router.ip,
                signal: 0,
                date: 0,
            }
            hostsStructure.push(host)
        }
        return {
            mac: macAddres,
            hosts: hostsStructure,
            // modified: true,
            macOwner: undefined
        }
    }
    /**
     * Загрузка списка роутеров для проверки
     */
    public async loadRoutersToCheck(): Promise<void> {
        for (const router of this.routers) {
            let ip = 'ip_' + router.ip.split('.')[3]
            this.ipList[ip] = Date.now() //startDate
        }        
    }

    /**
     *  Добавление параметров в Item
     * @param {*} item 
     * @param {*} ip 
     * @param {*} val 
     * @param {*} dateChange 
     */
    public async addParamToItem(item: IItemData, newComm: IBufferData): Promise<IItemData> {
        const host = await item.hosts.find((host) => host.ip === newComm.ip)
        if (host) {
            host.signal = newComm.signal,
            host.date = newComm.date
        }
        return item
    }

    /**
     * Метод очистки устаревших (более interval) мак-адресов (Item)
     * @param {Array} object 
     * @param {int} interval | время (милисек) устаревания макадреса
     */
    // public checkOldMacInPool(interval = 0) {
    //     if (this.macPool && this.macPool.length > 0 && interval > 0) {
    //         const agingPoint = this.app.tcpServer.getUTCTimeStamp() - interval
    //         for (let Item of this.macPool) {
    //             if (agingPoint >= Item.hosts.sort((a, b) => b.date - a.date)[0].date) {
    //                 this.macPool.splice(this.macPool.indexOf(Item), 1)
    //             }
    //         }
    //     }
    // }

    /**
     * Метод сохранения модифицированных МАСов в БД
     * 
     * @param {*} interval 
     */
    public async saveModifiedMac(interval = 0): Promise<void> {
        if (this.macPool && this.macPool.length > 0 && interval > 0) {
            const agingPoint = Date.now() - interval
            if (agingPoint > this.lastSaveToDB) {
                this.lastSaveToDB = agingPoint // дата последнего update в БД
                for (let Item of this.macPool) {
                    let hostSignal: {[key: string]:number} = {}
                    let maxValue: {[key: string]:number} = {}
                    let minSignal = -256
                    let bestHost = 'ip_'
                    let dateHost = 0
                    let signal = 0
                    for (const host of Item.hosts) {
                        signal = (host.signal) ? host.signal : minSignal
                        hostSignal[host.ip] = signal
                        if (signal > minSignal) {
                            bestHost = host.ip
                            dateHost = host.date ? host.date : 0
                            minSignal = signal
                        }
                    }
                    if (dateHost === 0) {
                        continue
                    }
                    maxValue[`ip_${bestHost.split('.')[2]}.${bestHost.split('.')[3]}`] = minSignal
                    let params = {
                        dateSignal: dateHost,
                        mac: Item.mac,
                        maxSignal: JSON.stringify(maxValue),
                        hosts: JSON.stringify(hostSignal),
                    }
                    await this.app.scanService.setScan(params)
                }
            }
        }
    }

    public async saveTestMac(Item: IBufferData): Promise<void> {
        let params = {
            dateSignal: (new Date).getTime(),
            mac: Item.mac,
            maxSignal: Item.signal.toString(),
            hosts: Item.ip,
        }
        await this.app.scanService.setScan(params)
    }

    /**
     * Старт процесса сохранения пакетов NewComm в БД
     */
    public async startProcess(): Promise<void> {
        while (this.newComm.length > 0) {
            const BufferItem: IBufferData|undefined = this.newComm.pop()
            if (BufferItem) {
                this.saveTestMac(BufferItem)
            }
        }
    }
    
    /**
     * MacPool Items 
     */
    public async getMacPool(): Promise<IItemData[]> {
        return await this.macPool
    }
    
    /**
     * newComm Items 
     */
    public async getNewComm(): Promise<string> {
        return await JSON.stringify(this.newComm, null, 4)
    }

    public async getIpList(): Promise<{[key: string]: number}> {
        return await this.ipList
    }
        
    public async getActiveRouter(status = [1]): Promise<IHostData[]> {
        const hosts: IHostData[] = []
        for (const router of this.routers) {
            let host: IHostData = {
                ip: router.ip,
                date: router.date,
                signal: router.signal
            }
            hosts.push(host)
        }
        return hosts
    }

    public async getWhiteMacList(): Promise<string> {

        return await JSON.stringify(this.whiteMacList)
    }

    public async setWhiteMacList(): Promise<void> {
        const lsts = [
            '90:4c:e5:64:e9:75',  // Ноут
            'f4:60:e2:c1:e6:38',  // Сергей
            '0c:8c:24:ce:14:74',  // Intercom
        ]
        this.whiteMacList = {
            version: Math.round(new Date().getTime() / 1000),
            list: lsts
        }
    }
    
    private async init(): Promise<void> {
        await new Promise(resolve => setTimeout(() => resolve(), 1000))
        await this.loadRoutersToCheck()
        await this.setWhiteMacList()
    }
}