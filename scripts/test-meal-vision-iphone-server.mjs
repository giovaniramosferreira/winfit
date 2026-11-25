import assert from 'node:assert/strict'
import * as helper from './dev-meal-vision-iphone.mjs'
assert.equal(typeof helper.isPrivateIPv4,'function')
for(const ip of ['192.168.68.57','10.0.0.1','172.16.0.2','172.31.255.1'])assert.equal(helper.isPrivateIPv4(ip),true)
for(const ip of ['127.0.0.1','0.0.0.0','8.8.8.8','172.32.0.1','192.168.999.1','192.168.1.1\nDNS:evil.test'])assert.equal(helper.isPrivateIPv4(ip),false)
assert.equal(helper.allowedDownload('plate-vision-fp32.onnx'),'plate-vision-fp32.onnx')
assert.equal(helper.allowedDownload('food101_labels.json'),'food101_labels.json')
assert.equal(helper.allowedDownload('cc-23.jpg'),'cc-23.jpg')
for(const file of ['ca-key.pem','server-key.pem','../ca-key.pem','images.json','cc-27.jpg'])assert.equal(helper.allowedDownload(file),null)
console.log('iPhone dev helper: private LAN binding and explicit file allowlist PASS')
