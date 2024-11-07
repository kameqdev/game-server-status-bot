import { Client, Events, ActivityOptions } from 'discord.js'
import { GameDig, Results } from 'gamedig'
import { format } from 'jsr:@std/datetime/format'
import config from './config.json' with { type: 'json' }


const client = new Client({ intents: [] });

const getDate = (): string => {
	const date = new Date();
	return format(date, 'dd-MM-yyyy HH:mm:ss')
}

const status = (state: Results | undefined): ActivityOptions => {
	if (!state) return { 
		name:	config.nameIfServerOffline	?? config.nameIfServerOnline, 
		state:	config.stateIfServerOffline	?? config.stateIfServerOnline, 
		type:	config.typeIfServerOffline	?? config.typeIfServerOnline
	}
	if (state.password) return { 
		name:	config.nameIfPasswordRequired	?? config.nameIfServerOffline	?? config.nameIfServerOnline, 
		state:	config.stateIfPasswordRequired	?? config.stateIfServerOffline	?? config.stateIfServerOnline, 
		type:	config.typeIfPasswordRequired	?? config.typeIfServerOffline	?? config.typeIfServerOnline
	}
	return { name: config.nameIfServerOnline, state: config.stateIfServerOnline, type: config.typeIfServerOnline }
}

const setActivity = async (client: Client): Promise<void> => {
	const state: Results | undefined = await GameDig.query({
		type: config.type,
		host: config.host,
		port: config.port,
		givenPortOnly: true,
		maxRetries: config.maxRetries
	}).catch((error: any) => config.logging && console.log(`[${getDate()}] Server is offline, error: ${error}`))

	config.logging && state && console.log(`[${getDate()}] Server is online`)

	const activityOptions = status(state)

	if (state) {
		activityOptions.name = activityOptions.name.replaceAll(/{(.*?)}/g, (_: string, key: string) => `${state[key]}`)
		activityOptions.state = activityOptions?.state?.replaceAll(/{(.*?)}/g, (_: string, key: string) => `${state[key]}`)
	}

	client?.user?.setActivity(activityOptions)
}

client.once(Events.ClientReady, async (client: Client): Promise<void> => {
	console.log(`Client ready!`);
	
	await setActivity(client)
	setInterval(async () => {
		await setActivity(client)
	}, config.refreshTime * 1000)
})

client.login(Deno.env.get('TOKEN'))