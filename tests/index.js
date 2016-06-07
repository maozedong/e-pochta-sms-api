'use strict';
let expect = require("chai").expect;
let sinon = require("sinon");
let request = require("request");
let SMSAPI = require("../index").SMSAPI;
let Stat = require("../index").Stat;
let gateway, stat;
let gatewayOptions = {
    publicKey: "publicKey",
    privateKey: "privateKey",
    url: "http://atompark.com/api/sms/"
};

describe('SMSAPI', () => {
    beforeEach(() => {
        gateway = new SMSAPI(gatewayOptions);
    });

    it('removeTrailingSlash() should remove trailing slash', () => {
        expect(gateway.removeTrailingSlash("/some/some/")).to.equal("/some/some");
    });

    it("calcMD5() should return md5 sum of sorted params", () => {
        let params = ["three", "one", "two", 1, undefined, null, ["Array item"]];
        sinon.stub(gateway, "calcMD5").returns("md5sum");

        expect(gateway.calcMD5(params)).to.equal("md5sum");
    });

    it("request() should call request.post", () => {
        let params = {"some": "param", "action": "someAction"};
        let postParams = {
            url: "http://atompark.com/api/sms/3.0/someAction",
            json: true,
            form: params
        };
        let spy = sinon.stub(request, "post").returns((params, cb) => {
            cb(null, null, {"result": {"some": "result"}});
        });

        gateway.request(params);

        expect(spy.calledWith(postParams)).to.equal(true);
    });

    it("processResponce() should return same value if no data.fields present", () => {
        let data = {"some": "val"};

        let output = gateway.processResponce(data);

        expect(output).to.equal(data);
    });

    it("processResponce() should return formatted data if data.fields present", () => {
        let data = {
            "fields": ["some", "field"],
            "count": 10,
            data: [
                [1, 2]
            ]
        };

        let output = gateway.processResponce(data);

        expect(output[0]).to.eql({"some": 1, "field": 2});
        expect(output.total).to.equal(data.count);
    });

    it("send() should call request() with proper params", () => {
        let params = {"some": "param", "action": "someAction"};
        let requestParams = {
            "some": "param",
            "action": "someAction",
            "version": "3.0",
            "key": gatewayOptions.publicKey,
            "sum": "md5sum"
        };
        let spy = sinon.stub(gateway, "request");
        sinon.stub(gateway, "calcMD5").returns("md5sum");

        gateway.send(params.action, params);

        expect(spy.calledWith(requestParams)).to.equal(true);
    });
});

describe("Stat", () => {

    beforeEach(() => {
        gateway = new SMSAPI(gatewayOptions);
        stat = new Stat(gateway);
    });

    it("createCampaign should call gateway.send with proper default params", () => {
        let params = {
            batch: 0,
            batchinterval: 0
        };
        let spy = sinon.stub(gateway, "send");

        stat.createCampaign({});
        expect(spy.calledWith("createCampaign", params)).to.equal(true);
    });
    
    it("sendSMS should call gateway.send with proper params", () => {
        let params = {
            sender: "sender",
            phone: "0236548",
            text: "test"
        };
        let spy = sinon.stub(gateway, "send");
        
        stat.sendSMS(params);
        expect(spy.calledWith("sendSMS", params)).to.equal(true);
    });
});