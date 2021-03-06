import { ISignalRConnection } from './connection/i.signalr.connection';
import { SignalRConfiguration } from './signalr.configuration';
import { SignalRConnection } from './connection/signalr.connection';
import { NgZone, Injectable, Inject } from '@angular/core';
import { IConnectionOptions } from './connection/connection.options';
import { ConnectionTransport } from './connection/connection.transport';
import { Observable } from 'rxjs/Observable';
import { ConnectionStatus } from './connection/connection.status';
import { SIGNALR_JCONNECTION_TOKEN } from './tokens';

declare var jQuery: any;

@Injectable()
export class SignalR {
    private _configuration: SignalRConfiguration;
    private _zone: NgZone;
    private _jHubConnectionFn: any;

    public constructor(
        configuration: SignalRConfiguration,
        zone: NgZone,
        @Inject(SIGNALR_JCONNECTION_TOKEN) jHubConnectionFn: Function
    ) {
        this._configuration = configuration;
        this._zone = zone;
        this._jHubConnectionFn = jHubConnectionFn;
    }

    public createConnection(options?: IConnectionOptions): SignalRConnection {
        let status: Observable<ConnectionStatus>;
        let configuration = this.merge(options ? options : {});

        try {

            let serializedQs = JSON.stringify(configuration.qs);
            let serializedTransport = JSON.stringify(configuration.transport);

            if (configuration.logging) {
                console.log(`Creating connecting with...`);
                console.log(`configuration:[url: '${configuration.url}'] ...`);
                console.log(`configuration:[hubName: '${configuration.hubName}'] ...`);
                console.log(`configuration:[qs: '${serializedQs}'] ...`);
                console.log(`configuration:[transport: '${serializedTransport}'] ...`);
            }
        } catch (err) { }

        // create connection object
        let jConnection = this._jHubConnectionFn(configuration.url);
        jConnection.logging = configuration.logging;
        jConnection.qs = configuration.qs;

        // create a proxy
        let jProxy = jConnection.createHubProxy(configuration.hubName);
        // !!! important. We need to register at least one function otherwise server callbacks will not work.
        jProxy.on('noOp', function () { });

        let hubConnection = new SignalRConnection(jConnection, jProxy, configuration, this._zone);

        return hubConnection;
    }


    public connect(options?: IConnectionOptions): Promise<ISignalRConnection> {

        return this.createConnection(options).start();
    }

    private merge(overrides: IConnectionOptions): SignalRConfiguration {
        let merged: SignalRConfiguration = new SignalRConfiguration();
        merged.hubName = overrides.hubName || this._configuration.hubName;
        merged.url = overrides.url || this._configuration.url;
        merged.qs = overrides.qs || this._configuration.qs;
        merged.logging = this._configuration.logging;
        merged.jsonp = overrides.jsonp || this._configuration.jsonp;
        merged.withCredentials = overrides.withCredentials || this._configuration.withCredentials;
        merged.transport = overrides.transport || this._configuration.transport;
        return merged;
    }

}
