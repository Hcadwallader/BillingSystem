import pkg from 'axios';
const { get, post } = pkg;

const baseUrl = 'https://billing.eng-test.wayflyer.com';

export const getAdvances = async (date) => {
	const response = await get(`${baseUrl}/advances`, {
		headers: {
			Today: `${date}`,
		},
	});
	return response.data.advances;
};

export const getRevenue = async (customerId, date) => {
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
};

export const issueCharge = async (mandateId, amount, date) => {
	console.log(mandateId);
	console.log(amount);
	const data = {
		amount: amount,
	};
	const response = await post(
		`${baseUrl}/mandates/${mandateId}/charge`,
		data,
		{
			headers: {
				Today: `2022-06-30`,
			},
		}
	);
	return response.data;
};

export const billingComplete = async (advanceId) => {
	const response = await post(
		`${baseUrl}/advances/${advanceId}/billing_complete`
	);
	return response.data;
};
