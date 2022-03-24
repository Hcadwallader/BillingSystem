import pkg from 'axios';
const { get, post } = pkg;
import log from 'loglevel';
log.setLevel('debug');

const baseUrl = 'https://billing.eng-test.wayflyer.com';
const successResponse = 'Accepted';

export const getAdvances = async (date) => {
	try {
		const response = await get(`${baseUrl}/advances`, {
			headers: {
				Today: date,
			},
		});
		return response.data.advances;
	} catch (error) {
		log.warn(`Error getting advances from API: ${error}`);
		return [];
	}
};

export const getRevenue = async (customerId, date, todaysDate) => {
	try {
		const response = await get(
			`${baseUrl}/customers/${customerId}/revenues/${date}`,
			{
				headers: {
					Today: todaysDate,
				},
			}
		);
		return response.data;
	} catch (error) {
		log.warn(`Error getting revenue from API: ${error}`);
		return null;
	}
};

export const issueCharge = async (mandateId, amount, date) => {
	try {
		const data = {
			amount: amount,
		};
		const response = await post(
			`${baseUrl}/mandates/${mandateId}/charge`,
			data,
			{
				headers: {
					Today: date,
				},
			}
		);
		if(response.data === successResponse) {
			log.info(`successfully issued charge for mandate ${mandateId} for £${amount} on ${date}`)
		}
		return response.data === successResponse;
	} catch (error) {
		log.warn(`Error when issuing charge: ${error}`);
		return false;
	}
};

export const billingComplete = async (advanceId, date) => {
	try {
		const response = await post(
			`${baseUrl}/advances/${advanceId}/billing_complete`,
			{},
			{
				headers: {
					Today: date,
				},
			}
		);
		if (response.data === successResponse) {
			log.info(
				`successfully completed billing for advance ${advanceId} on ${date}`
			);
		}
		return response.data === successResponse;
	} catch (error) {
		log.warn(`Error when issuing charge: ${error}`);
		return false;
	}
};
