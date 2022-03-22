import pkg from 'axios';

const { get, post } = pkg;

const baseUrl = 'https://billing.eng-test.wayflyer.com';
const successResponse = 'Accepted';

export const getAdvances = async (date) => {
	try {
		const response = await get(`${baseUrl}/advances`, {
			headers: {
				Today: `${date}`,
			},
		});
		return response.data.advances;
	} catch (error) {
		console.log(`Error getting advances from API: ${error}`);
		return [];
	}
};

export const getRevenue = async (customerId, date) => {
	try {
		//TODO - replace hard coded date
		const response = await get(
			`${baseUrl}/customers/${customerId}/revenues/${date}`,
			{
				headers: {
					Today: `2022-06-30`,
				},
			}
		);
		return response.data;
	} catch (error) {
		console.log(`Error getting revenue from API: ${error}`);
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
		return response.data === successResponse;
	} catch (error) {
		console.log(`Error when issuing charge: ${error}`);
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
		return response.data === successResponse;
	} catch (error) {
		console.log(`Error when issuing charge: ${error}`);
		return false;
	}
};
