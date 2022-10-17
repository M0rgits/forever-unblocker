//imported modules

const fs = require('fs');
const util = require('util');
const { stderr } = require('process');
const { response } = require("express");
const exec = util.promisify(require('child_process').exec);
const authkey = "db74dc5e0070afb5c7c63e8611ae506a9de15"
const email = 'morgits03@gmail.com'
const accid = '585dd72d29782e3502c3d4d67be29343'


function startlist() {
  let list = fs.readFileSync('./urls/allsitelist.txt').toString()
  fs.writeFileSync('./urls/sitelist.txt', list);
  fs.writeFileSync('./urls/rejsitelist.txt', "");
  return;
}


//Remove used entry from txt file

async function rmurl(input, location) {
  newarray = fs.readFileSync(`${location}`).toString().replace(input, "").replace(/(\r\n|\n|\r)/, "");
  fs.writeFileSync(`${location}`, newarray);
  return;
}


//Executing curl/wget command

async function sendcmd() {
  let url = fs.readFileSync('./urls/sitelist.txt').toString().split('\n').shift();
  await fs.writeFileSync(`./html/${url}.txt`, "");
  await exec(`curl https://${url} -o ./html/${url}.txt`);
  htmlcheck();
}


//Reading output and checking for key

function htmlcheck() {
  let url = fs.readFileSync('./urls/sitelist.txt').toString().split('\n').shift();
  const valid = /<meta name=\"valid\">/;
  let htmldata = fs.readFileSync(`./html/${url}.txt`, 'utf8')
  let result = valid.test(htmldata);
  if (result === true) {
    fs.writeFileSync('./urls/url.txt', url);
    console.log(`${url} is valid`);
    setTimeout(sendcmd, 3000);
  }
  else {
    rmurl(url, './urls/sitelist.txt')
    fs.appendFileSync('./urls/rejsitelist.txt', `${url}\n`);
    exec(`rm ./html/${url}.txt`)
    console.log(result);
    console.log(htmldata);
    setTimeout(sendcmd, 100);
    return;
  }
};


//Cloudflare API

async function cfl() {
  let domain = fs.readFileSync('./urls/domains.txt').toString().split('\n').shift();


  //Import Domains

  await exec(`curl -o ./curl/zoneid.txt -X POST -H "X-Auth-Key: ${authkey}" -H "X-Auth-Email: ${email}" \ -H "Content-Type: application/json" \ "https://api.cloudflare.com/client/v4/zones" \  --data '{"account": {"id": "${accid}"}, "name":"'${domain}'","jump_start":true}'`);
  console.log('imported domain');

  
  //Get Zone Id
  
  let zoneid = await fs.readFileSync('./curl/zoneid.txt').toString().match(/"id":"[a-z0-9]+"/i).shift().replace('"id":', "").replace('"', "").replace('"', "");


  //Set Custom Hostname 

await exec(`curl -o ./curl/valid.txt -X POST "https://api.cloudflare.com/client/v4/zones/1f79a6eaf76f93aabe88e6b3cce2f04e/custom_hostnames" \ -H "X-Auth-Email: ${email}" \ -H "X-Auth-Key: ${authkey}" \ -H "Content-Type: application/json" \ --data '{"hostname":"${domain}","ssl":{"method":"txt","type":"dv","settings":{"http2":"on","min_tls_version":"1.0","tls_1_3":"on","ciphers":["ECDHE-RSA-AES128-GCM-SHA256","AES128-SHA", "SHA256-RSA"],"early_hints":"on"},"bundle_method":"ubiquitous","wildcard":false}}'`);
  let txtname = `_cf-custom-hostname.${domain}`
  let txtbody = await fs.readFileSync('./curl/valid.txt').toString().match(/"value": "[a-z0-9`-]+"/i).shift().replace('"value": ', "").replace('"', "").replace('"', "");


  //SetDns
  
  await exec(`curl -X POST "https://api.cloudflare.com/client/v4/zones/${zoneid}/dns_records" \ -H "X-Auth-Email: ${email}" \ -H "X-Auth-Key: ${authkey}" \ -H "Content-Type: application/json" \ --data '{"type":"CNAME","name":"@","content":"cname.carnvas.org","ttl":3600,"priority":10,"proxied":true}'`);
  await exec(`curl -X POST "https://api.cloudflare.com/client/v4/zones/${zoneid}/dns_records" \ -H "X-Auth-Email: ${email}" \ -H "X-Auth-Key: ${authkey}" \ -H "Content-Type: application/json" \ --data '{"type":"CNAME","name":"www","content":"cname.carnvas.org","ttl":3600,"priority":10,"proxied":true}'`);
  await exec(`curl -o ./curl/txtdns.txt -X POST "https://api.cloudflare.com/client/v4/zones/${zoneid}/dns_records" \ -H "X-Auth-Email: ${email}" \ -H "X-Auth-Key: ${authkey}" \ -H "Content-Type: application/json" \ --data '{"type":"TXT","name":"${txtname}","content":"${txtbody}","ttl":1,"priority":10,"proxied":false}'`);


  //set ssl to full

  await exec(`curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${zoneid}/settings/ssl" \ -H "X-Auth-Email: ${email}" \ -H "X-Auth-Key: ${authkey}" \ -H "Content-Type: application/json" \ --data '{"value":"full"}'`)
  
  
  await rmurl(domain, `./urls/domains.txt`);
  setTimeout(callback, 500);
}

function callback() {
  setTimeout(cfl, 15000)
  console.log('setup domain');
}

exec('./bin/www')
startlist()
setTimeout(sendcmd, 500)


