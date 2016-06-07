#e_pochta
This is an API wrapper for online SMS service [E-pochta](http://www.epochta.ru/products/sms/v3.php) v3.0.

##Installation

```sh
$ npm install e-pochta-sms-api
```

##Usage

```javascript
let SMSAPI = require("e-pochta-sms-api").SMSAPI;
let Stat = require("e-pochta-sms-api").Stat;
let gatewayOptions = {
    publicKey: "publicKey",
    privateKey: "privateKey",
    url: "http://atompark.com/api/sms/"
};
let gateway = new SMSAPI(gatewayOptions);
let stat = new Stat(gateway);

# send sms
let resultPromise = stat.send_sms({
		# read the api to provide correct arguments
		'sender': 'Name',
		'text': 'Hello World!',
		'phone': '71234567890',
		'datetime': '',
		'sms_lifetime': 0
	});
resultPromise.then((resp) => {
    console.log(resp);
})
.catch((err) => {
    console.log(err);
})
```