await exec(`curl -o ./curl/zoneid.txt -X POST -H "X-Auth-Key: ${authkey}" -H "X-Auth-Email: ${email}" \ -H "Content-Type: application/json" \ "https://api.cloudflare.com/client/v4/zones" \  --data '{"account": {"id": "${accid}"}, "name":"'${domain}'","jump_start":true}'`);
  console.log('imported domain');