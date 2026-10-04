/**
 * dsh-notify-yimit 的 Host 面 Typert 清单(由 typert-loader 自动扫描注册)。
 * 手写清单,结构与 @deepseek-ai/dsh-typert-generator 产物一致:
 * `./typert` 导出 TYPERT,invocations 的 codec 必须是 zod v4 实例。
 */
import {
	z
} from 'zod'

const kindColorSchema = z.object({
	bg: z.string(),
	fg: z.string(),
	accent: z.string().optional(),
	enabled: z.boolean(),
})

const toastSchema = z.object({
	width: z.number(),
	gap: z.number(),
	position: z.object({
		left: z.number(),
		top: z.number(),
	}).nullable(),
})

const configSchema = z.object({
	enabled: z.boolean(),
	mode: z.enum(['system', 'custom', 'off']),
	maxVisible: z.number(),
	durationMs: z.number(),
	browser: z.string(),
	bgColor: z.string(),
	textColor: z.string(),
	locale: z.enum(['zh', 'en']),
	toast: toastSchema,
	colors: z.object({
		completed: kindColorSchema,
		error: kindColorSchema,
		running: kindColorSchema,
		approval: kindColorSchema,
		question: kindColorSchema,
	}),
})

const notifyEventSchema = z.object({
	id: z.string(),
	sessionId: z.string(),
	title: z.string(),
	kind: z.enum(['completed', 'error', 'running', 'approval', 'question']),
	text: z.string(),
	activity: z.string().optional(),
	at: z.number(),
})

/**
 * 宿主故障状态(④ 设置页横幅的数据源)。
 * null = 正常。旧宿主不返回该字段,靠 .default(null) 兼容。
 */
const hostErrorSchema = z.object({
	code: z.number().nullable(),
	signal: z.string().nullable(),
	at: z.number(),
	count: z.number(),
	retryAt: z.number(),
}).nullable().default(null)

const getStateSchema = z.object({
	config: configSchema,
	// 可选+默认 false:旧宿主(无该字段)仍能通过校验,按 web 端处理。
	desktop: z.boolean().default(false),
	// 可选+默认:旧宿主无这两个字段也能通过校验。
	// 注意 zod 的 z.object 会**丢弃**未声明字段,所以新增字段必须在这里声明,
	// 否则宿主返回了也会被 codec 吃掉(已实测确认)。
	hostError: hostErrorSchema,
	pendingCount: z.number().default(0),
	events: z.array(notifyEventSchema),
})

const updateConfigSchema = z.object({
	config: configSchema,
})

const ackSchema = z.object({
	ok: z.boolean(),
})

const browserSchema = z.object({
	id: z.string(),
	name: z.string(),
	path: z.string(),
})

const listBrowsersSchema = z.object({
	browsers: z.array(browserSchema),
})

const patchSchema = z.record(z.string(), z.unknown())

// 0.2.0-rc.2 契约:strict codec 除 mode/typeSymbol/schema 外还必须带 create() 工厂
// (typert-loader requireStrictCodec / typert registry validateCodec 都会校验)。
const strictCodec = (typeSymbol, schema) => ({
	mode: 'strict',
	typeSymbol,
	schema,
	create: () => schema,
})

const _state$codec = strictCodec('dsh-notify-yimit#NotifyState', getStateSchema)
const _config$codec = strictCodec('dsh-notify-yimit#NotifyConfig', configSchema)
const _patch$codec = strictCodec('dsh-notify-yimit#NotifyConfigPatch', patchSchema)
const _ack$codec = strictCodec('dsh-notify-yimit#AckResult', ackSchema)
const _browsers$codec = strictCodec('dsh-notify-yimit#BrowserList', listBrowsersSchema)

export const TYPERT = {
	package: 'dsh-notify-yimit',
	face: 'host',
	schemas: [],
	invocations: [{
			id: 'dsh-notify-yimit#notify/getState',
			service: 'notify',
			namespace: 'notify',
			method: 'getState',
			invocation: {
				kind: 'direct'
			},
			parameters: [],
			result: _state$codec,
		},
		{
			id: 'dsh-notify-yimit#notify/updateConfig',
			service: 'notify',
			namespace: 'notify',
			method: 'updateConfig',
			invocation: {
				kind: 'direct'
			},
			parameters: [{
				name: 'patch',
				wire: 'patch',
				source: 'json',
				codec: _patch$codec
			}, ],
			result: _config$codec,
		},
		{
			id: 'dsh-notify-yimit#notify/ackEvents',
			service: 'notify',
			namespace: 'notify',
			method: 'ackEvents',
			invocation: {
				kind: 'direct'
			},
			parameters: [{
				name: 'ids',
				wire: 'ids',
				source: 'json',
				codec: {
					mode: 'strict',
					typeSymbol: 'dsh-notify-yimit#EventIds',
					schema: z.array(z.string()),
					create: () => z.array(z.string())
				}
			}, ],
			result: _ack$codec,
		},
		{
			id: 'dsh-notify-yimit#notify/listBrowsers',
			service: 'notify',
			namespace: 'notify',
			method: 'listBrowsers',
			invocation: {
				kind: 'direct'
			},
			parameters: [],
			result: _browsers$codec,
		},
		{
			id: 'dsh-notify-yimit#notify/startEditMode',
			service: 'notify',
			namespace: 'notify',
			method: 'startEditMode',
			invocation: {
				kind: 'direct'
			},
			parameters: [],
			result: _ack$codec,
		},
		{
			id: 'dsh-notify-yimit#notify/endEditMode',
			service: 'notify',
			namespace: 'notify',
			method: 'endEditMode',
			invocation: {
				kind: 'direct'
			},
			parameters: [],
			result: _ack$codec,
		},
		{
			id: 'dsh-notify-yimit#notify/retryHost',
			service: 'notify',
			namespace: 'notify',
			method: 'retryHost',
			invocation: {
				kind: 'direct'
			},
			parameters: [],
			result: _ack$codec,
		},
	],
	model: {
		services: [{
			description: 'dsh-notify-yimit notification config & event queue service.',
			summary: 'dsh-notify-yimit notification config & event queue service.',
			tags: [],
			jsDoc: '/** dsh-notify-yimit notification config & event queue service. */',
			key: 'notify',
			exportName: 'NotifyService',
			members: [{
					kind: 'method',
					name: 'getState',
					signature: 'getState(): NotifyState',
					summary: 'Read the current config and all unacknowledged notification events.',
					jsDoc: '/** Read the current config and all unacknowledged notification events. */',
				},
				{
					kind: 'method',
					name: 'updateConfig',
					signature: 'updateConfig(patch: NotifyConfigPatch): NotifyConfig',
					summary: 'Deep-merge a config patch and persist it.',
					jsDoc: '/** Deep-merge a config patch and persist it. */',
				},
				{
					kind: 'method',
					name: 'ackEvents',
					signature: 'ackEvents(ids: string[]): AckResult',
					summary: 'Acknowledge consumed event ids to prevent duplicate alerts.',
					jsDoc: '/** Acknowledge consumed event ids to prevent duplicate alerts. */',
				},
			],
			types: [],
		}, ],
		events: [],
		objects: [],
	},
}

export default TYPERT
