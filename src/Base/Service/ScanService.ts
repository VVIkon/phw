import { Application } from '../../Application'
import DataTypes from 'sequelize'
import { AbstractService } from './AbstractService';

export interface IScanModel{
    id?: number|null,
    dateSignal: number,
    mac: string,
    maxSignal: string,
    hosts: string
}

export class ScanService extends AbstractService {
    public scanModel: any
    

    constructor(protected app: Application) { 
        super(app)

        this.scanModel = app.dbService.sequelize.define('scan', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                field: 'id'
            },
            dateSignal: {
                type: DataTypes.BIGINT,
                field: 'date_signal',
                allowNull: false,
            },
            mac: {
                type: DataTypes.STRING(17),
                field: 'mac',
                allowNull: false,
            },
            maxSignal: {
                type: DataTypes.STRING(30),
                field: 'max_signal',
                allowNull: false,
            },
            hosts: {
                type: DataTypes.STRING(700),
                field: 'hosts',
                allowNull: false
            }

        })

    }

    ///======================================================== getters =========================
    // Асинхронная запись журнала
    public setScan(params: IScanModel) {
        try {
            this.scanModel.create({
                id: null,
                dateSignal: Math.floor(params.dateSignal / 1000),
                mac: params.mac,
                maxSignal: params.maxSignal,
                hosts: params.hosts
           })
        } catch (err) {
            this.app.logApp.log('Ошибка: ' + err, JSON.stringify(params, null, 4))
        }
        return true // true для снятия флага модификации МАСа
    }

}