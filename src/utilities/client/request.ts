import { urlPrefix } from '../shared/constants'
import { parenthesesFilled, getCommonReqFieldsData } from '../shared/helper'
import { apiKeys } from '../shared/keys'
import { IRequestNameMap, TReqParas, requestInfoMap, TReqMethod, TApiType } from '../shared/meta'
import { TReqBase } from '../shared/meta_request'
import { to64_browser } from './helper'

export async function createRestRequestFromBrowser<K extends keyof IRequestNameMap>(reqName: K, paras: TReqParas<K>) {
    let reqInfo = requestInfoMap[reqName]
    let url = ''
    if (reqInfo.method == 'GET' && paras.json) {
        url = await buildUrlFromAllFields_GET_browser(reqName, paras.json as TReqBase, paras.path)
    } else {
        url = await buildUrlFromOnlyCommonFields_browser(reqInfo.method, reqName, paras.path)
    }
    let info: { url: string, init?: { method: string, body?: string } }
    if (paras.json) {
        info = { url: urlPrefix + url, init: { method: reqInfo.method, body: JSON.stringify(paras.json) } }
    } else {
        info = { url: urlPrefix + url, init: { method: reqInfo.method } }
    }

    let req: Promise<Response>
    if (info.init && info.init.method == 'POST') {
        if (info.init.body) {
            req = fetch(info.url, { method: 'POST', body: info.init.body, headers: { 'Content-Type': 'application/json' } })
        } else {
            req = fetch(info.url, { method: 'POST' })
        }
    } else {
        req = fetch(info.url, { method: 'GET' })
    }
    return req
}

async function buildUrlFromOnlyCommonFields_browser(method: TReqMethod, reqName: string, pathParas?: string) {
    let reqname = reqName
    if (pathParas) reqname = parenthesesFilled(reqName, pathParas)
    let tmp: TApiType = method == 'GET' ? 'read' : 'trade'
    let obj = getCommonReqFieldsData(tmp) as Record<string, boolean | number | string>
    let keys = Object.keys(obj).sort()
    let part1 = keys.map(x => `${x}=${obj[x].toString()}`).join('&')
    let part2 = ""
    if (method == 'GET') part2 = 'GET\napi.huobi.pro\n' + reqname + '\n' + part1
    if (method == 'POST') part2 = 'POST\napi.huobi.pro\n' + reqname + '\n' + part1
    let scrtk = method == 'GET' ? apiKeys.forRead.secretKey : apiKeys.forTrade.secretKey
    let part3 = await to64_browser(part2, scrtk)
    return `${reqname}?${part1}&Signature=${part3}`
}

async function buildUrlFromAllFields_GET_browser(reqName: string, jsonParas: Record<string, boolean | number | string>, pathParas?: string) {
    let reqname = reqName
    if (pathParas) {
        reqname = parenthesesFilled(reqName, pathParas)
    }
    let obj = { ...getCommonReqFieldsData('read'), ...jsonParas } as Record<string, boolean | number | string>
    let keys = Object.keys(obj).sort()
    let part1 = keys.map(x => `${x}=${obj[x].toString()}`).join('&')
    let part2 = 'GET\napi.huobi.pro\n' + reqname + '\n' + part1
    let part3 = await to64_browser(part2, apiKeys.forRead.secretKey)
    return `${reqname}?${part1}&Signature=${part3}`
}
