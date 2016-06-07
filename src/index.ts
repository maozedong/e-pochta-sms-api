 import request = require("request");
 import md5 = require("md5");
 
 interface IEPochtaError {
    error:string;
    code:string;
    result:string;
}

export interface ISMSAPIOptions {
    publicKey: string;
    privateKey: string;
    url: string;
    testMode?: boolean;
    version?: string;
}

interface IParams {
    version:string;
    action:string;
    publicKey:string;
    [name:string]:any;
}

interface IEPochtaListResponse {
    [idx:number]:{[key:string]:any};
    total:number;
}

export class SMSAPI {

    private static DEFAULT_VERSION = "3.0";
    // private static URL = `http://api.myatompark.com/sms/${EPochtaServiceBase.VERSION}`;

    private publicKey:string;
    private privateKey:string;
    private url: string;
    private version: string;
    private testMode: boolean;

    constructor(options: ISMSAPIOptions) {
        this.publicKey = options.publicKey;
        this.privateKey = options.privateKey;
        this.url = this.removeTrailingSlash(options.url);
        this.version = options.version || SMSAPI.DEFAULT_VERSION;
        this.testMode = !!options.testMode || false;
    }

    private removeTrailingSlash(str: string) {
        return str.replace(/\/$/, "");
    }

    private calcMD5(params:IParams) {
        let keys = Object.keys(params);
        let result = '';
        keys.sort();
        keys.forEach((key) => {
            //This is hack for correct md5 summ calculating
            //when we have array value in param, we must concatenate with 'Array' string
            //instead of value of this array =\
            //because of PHP origin of EPochta engine
            if (Array.isArray(params[key])) {
                result += "Array";
            } else {
                result += params[key];
            }
        });
        result += this.privateKey;
        return md5(result);
    }

    private request<T>(params:IParams) {
        return new Promise<T>((resolve, reject) => {
            try {
                request.post({
                        url: `${this.url}/${this.version}/${params.action}`,
                        json: true,
                        form: params
                    },
                    (err, res, body) => {
                        if (err) {
                            return reject(err);
                        }
                        //API always responds with statusCode=200. Need to examine body to check on errors
                        if (body.error) {
                            return reject(body);
                        }
                        let result = this.processResponce(body.result);
                        resolve(result);
                    });
            }catch (err){
                reject(err);
            }
        });
    }

    //we need this for proper md5 sum
    private sanitizeParams(params) {
        for(let key in params) {
            if(params.hasOwnProperty(key) && params[key] == undefined){
                params[key] = '';
            }
        }
    }

    private processResponce(result) {
        if (!result.fields) return result;
        let fields = result.fields;
        let processedResult = [];

        Object.defineProperty(processedResult, 'total', {enumerable: false, value: result.count});
        result.data.forEach((item) => {
            let processedItem = {};
            fields.forEach((field, index) => {
                processedItem[field] = item[index];
            });
            processedResult.push(processedItem)
        });
        return processedResult;
    }

    send<T>(action, params) {
        if(this.testMode){ params.testMode = true;}
        Object.assign(params, {
            action: action,
            version: this.version,
            key: this.publicKey
        });
        this.sanitizeParams(params);
        let sum = this.calcMD5(params);
        Object.assign(params, {sum: sum});
        return this.request<T>(params);
    }
}

export class Addressbook {

    constructor(private gateway: SMSAPI){}

    addAddressbook(params:{name:string, description?:string}) {
        return this.gateway.send<{result:{addressbook_id:number}}>('addAddressbook', params);
    }

    delAddressbook(params:{idAddressBook:number}) {
        return this.gateway.send('delAddressbook', params);
    }

    editAddressbook(params:{idAddressBook:number, newName: string, newDescr: string}) {
        return this.gateway.send('editAddressbook', params);
    }

    getAddressbook(params:{idAddressBook?:number, from?:number, offset?:number}): any {
        return this.gateway.send('getAddressbook', params);
    }

    searchAddressBook(params:{searchFields?:any, from?: number, offset?: number}) {
        return this.gateway.send('searchAddressBook', params);
    }

    cloneaddressbook(params: {idAddressBook: number}){
        return this.gateway.send('cloneaddressbook', params);
    }

    addPhoneToAddressBook(params: {idAddressBook: number, phone: number, variables?: string}){
        return this.gateway.send('addPhoneToAddressBook', params);
    }

    //TODO: check if method exists. It called 'addPhonesToAddressBook' in documentation
    addPhonesToAddressBook(params: {idAddressBook: number, data: { phone: number, variables?: string}}){
        return this.gateway.send('addPhonesToAddressBook', params);
    }

    getPhoneFromAddressBook(params: {idAddressBook?: number, idPhone?: number, phone?: number, from?: number, offset?: number}){
        return this.gateway.send('getPhoneFromAddressBook', params);
    }

    delPhoneFromAddressBook(params: {idAddressBook: number, idPhone: number[]}){
        return this.gateway.send('delPhoneFromAddressBook', params);
    }

    delphonefromaddressbookgroup(params: {idPhones: number[]}){
        return this.gateway.send('delphonefromaddressbookgroup', params);
    }

    editPhone(params: {idPhone: number, phone: string, variables: string}){
        return this.gateway.send('addPhoneToAddressBook', params);
    }

    searchPhones(params: {searchFields: any, from: number, offset: number}){
        return this.gateway.send('searchPhones', params);
    }
}

export class Stat {

    constructor(private gateway: SMSAPI) {}

    //dateTime example 2012-05-01 00:20:00
    createCampaign(params: {sender?: string, text?: string, list_id?: number, datetime?: string,
        batch?: number, batchinterval?: number, sms_lifetime?: number, control_phone?: number}){
        params.batch = params.batch || 0;
        params.batchinterval = params.batchinterval || 0;

        return this.gateway.send('createCampaign', params);
    }

    //dateTime example 2012-05-01 00:20:00
    sendSMS(params: {sender: string, text?: string, phone?: string, datetime?: string, sms_lifetime?: number}){
        return this.gateway.send('sendSMS', params);
    }

    //dateTime example 2012-05-01 00:20:00
    sendSMSGroup(params: {sender?: string, text?: string, phones?: number[], datetime?: string, sms_lifetime?: number}){
        return this.gateway.send('sendsmsgroup', params);
    }
}