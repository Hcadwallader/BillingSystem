import pkg from 'axios';
const { get, post } = pkg;

const baseUrl = 'https://billing.eng-test.wayflyer.com';

export const getAdvances = async (date) => {
	try {
		const response = await get(`${baseUrl}/advances`, {
			headers: {
				Today: `${date}`,
			},
		});
		return response.data.advances;
	} catch (error) {
		console.log(error.response.data.error);
	}
};

export const getRevenue = async (customerId, date) => {
	//TODO - replace hard coded date
	try {
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
		console.log(error.response.data.error);
	}
};

export const issueCharge = async (mandateId, amount, date) => {
	console.log(mandateId);
	console.log(amount);
	const data = {
		amount: amount,
	};
	try {
		const response = await post(
			`${baseUrl}/mandates/${mandateId}/charge`,
			data,
			{
				headers: {
					Today: `2022-06-30`,
					'Content-Type': 'application/json',
				},
			}
		);
		return response.data;
	} catch (error) {
		console.log(error.response.data.error);
	}
};

export const billingComplete = async (advanceId) => {
	try {
		const response = await post(
			`${baseUrl}/advances/${advanceId}/billing_complete`,
			{
				headers: {
					Today: `2022-06-30`,
					'Content-Type': 'application/json',
				},
			}
		);
		return response.data;
	} catch (error) {
		console.log(error.response.data.error);
	}
};
