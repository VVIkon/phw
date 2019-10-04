import { Application } from '../../Application'
import  Sequelize  from 'sequelize'
import { AbstractService } from './AbstractService';

export class DbService extends AbstractService {
    public sequelize: Sequelize.Sequelize
    public dbConnected = false

    constructor(protected app: Application) {
        super(app)

        this.sequelize = new Sequelize(app.config.db.name, app.config.db.user, app.config.db.password, {
            host: app.config.db.host,
            dialect: 'postgres',
            define: {
                timestamps: false,
                underscored: true,
                freezeTableName: true,
            },
            operatorsAliases: false,
            logging: app.config.node_env === 'develop',
        })

        this.sequelize.authenticate()
            .then(() => {
                this.dbConnected = true
                console.log('Successfully connected to postgres')
            })
            .catch(err => {
                console.log(`Error while connecting to DB: ${err}`)
            })
    }

    public async onDbConnected() {
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (this.dbConnected) {
                    resolve()
                    clearInterval(interval)
                }
            }, 50)
        })
    }



}