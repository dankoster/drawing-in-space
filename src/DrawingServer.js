const baseUrl = "http://localhost:1337";

export default class DrawingServer {

	async retryUntilSuccess(url, body) {
		let response
		do {
			response = await (await fetch(url, body))
			if (response.status != 200) console.warn('retrying', {url, body})
		}
		while (response.status != 200)

		return response
	}

	async addPoints(points) {
		return await(await this.retryUntilSuccess(`${baseUrl}/points/add`, {
			method: "POST",
			body: JSON.stringify(points),
			cache: "no-cache",
			headers: {
				"Content-Type": "application/json",
			},
		})).json()
	}

	async getPoints() {
		return await (await this.retryUntilSuccess(`${baseUrl}/points`)).json();
	}

	async reset() {
		return await (await this.retryUntilSuccess(`${baseUrl}/reset`)).json();
	}
}
