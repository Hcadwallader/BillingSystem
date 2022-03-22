import {
	billingComplete,
	getAdvances,
	getRevenue,
	issueCharge,
} from '../apiClient.js';
import axios from 'axios';

const advancesUrl = `https://billing.eng-test.wayflyer.com/advances`;
const defaultDate = '2022-03-01';
const defaultAdvance = '1';
const customerId = '4';
const mandateId = '3';
const defaultAmount = '7';

jest.mock('axios');

describe('Get advances', () => {
	test('Handles successful response', async () => {
		const data = {
			advances: [
				{
					created: '2022-01-02',
					customerId: 1,
					fee: '2500.00',
					id: 1,
					mandateId: 2,
					repayment_percentage: 11,
					repayment_start_date: '2022-01-05',
					total_advanced: '60000.00',
				},
			],
		};
		axios.get.mockResolvedValueOnce(mocked200ApiResponse(data));

		const response = await getAdvances(defaultDate);

		expect(axios.get).toHaveBeenCalledWith(advancesUrl, {
			headers: { Today: defaultDate },
		});
		expect(response).toEqual(data['advances']);
	});

	test('Handles missing data', async () => {
		const data = {
			advances: [],
		};
		axios.get.mockResolvedValueOnce(mocked200ApiResponse(data));

		const response = await getAdvances(defaultDate);

		expect(axios.get).toHaveBeenCalledWith(advancesUrl, {
			headers: { Today: defaultDate },
		});
		expect(response).toEqual(data['advances']);
	});

	test('Handles error response', async () => {
		axios.get.mockRejectedValueOnce();

		const response = await getAdvances(defaultDate);

		expect(axios.get).toHaveBeenCalledWith(advancesUrl, {
			headers: { Today: defaultDate },
		});
		expect(response).toEqual([]);
	});
});

describe('Get revenue', () => {
	const expectedUrl = `https://billing.eng-test.wayflyer.com/customers/${customerId}/revenues/${defaultDate}`;
	test('Handles successful response', async () => {
		const data = {
			amount: '8920.20',
		};
		axios.get.mockResolvedValueOnce(mocked200ApiResponse(data));

		const response = await getRevenue(customerId, defaultDate);

		expect(axios.get).toHaveBeenCalledWith(expectedUrl, {
			headers: { Today: `2022-06-30` },
		});
		expect(response).toEqual(data);
	});

	test('Handles error response', async () => {
		axios.get.mockRejectedValueOnce();

		const response = await getRevenue(customerId, defaultDate);

		expect(axios.get).toHaveBeenCalledWith(expectedUrl, {
			headers: { Today: `2022-06-30` },
		});
		expect(response).toBeNull();
	});
});

describe('Issue charge', () => {
	const expectedUrl = `https://billing.eng-test.wayflyer.com/mandates/${mandateId}/charge`;
	test('Handles successful response', async () => {
		axios.post.mockResolvedValueOnce(mocked200ApiResponse('Accepted'));

		const response = await issueCharge(mandateId, defaultAmount, defaultDate);

		expect(axios.post).toHaveBeenCalledWith(
			expectedUrl,
			{ amount: defaultAmount },
			{ headers: { Today: defaultDate } }
		);
		expect(response).toBeTruthy();
	});

	test('Handles failure response', async () => {
		axios.post.mockResolvedValueOnce(mocked200ApiResponse('Failed'));

		const response = await issueCharge(mandateId, defaultAmount, defaultDate);

		expect(axios.post).toHaveBeenCalledWith(
			expectedUrl,
			{ amount: defaultAmount },
			{ headers: { Today: defaultDate } }
		);
		expect(response).toBeFalsy();
	});

	test('Handles error response', async () => {
		axios.post.mockRejectedValueOnce();

		const response = await issueCharge(mandateId, defaultAmount, defaultDate);

		expect(axios.post).toHaveBeenCalledWith(
			expectedUrl,
			{ amount: defaultAmount },
			{ headers: { Today: defaultDate } }
		);
		expect(response).toBeFalsy();
	});
});

describe('Billing complete', () => {
	const expectedUrl = `https://billing.eng-test.wayflyer.com/advances/${defaultAdvance}/billing_complete`;
	test('Handles successful response', async () => {
		axios.post.mockResolvedValueOnce(mocked200ApiResponse('Accepted'));

		const response = await billingComplete(defaultAdvance, defaultDate);

		expect(axios.post).toHaveBeenCalledWith(
			expectedUrl,
			{},
			{ headers: { Today: defaultDate } }
		);
		expect(response).toBeTruthy();
	});

	test('Handles failure response', async () => {
		axios.post.mockResolvedValueOnce(mocked200ApiResponse('Failed'));

		const response = await billingComplete(defaultAdvance, defaultDate);

		expect(axios.post).toHaveBeenCalledWith(
			expectedUrl,
			{},
			{ headers: { Today: defaultDate } }
		);
		expect(response).toBeFalsy();
	});

	test('Handles error response', async () => {
        axios.post.mockRejectedValueOnce();

		const response = await billingComplete(defaultAdvance, defaultDate);

		expect(axios.post).toHaveBeenCalledWith(
			expectedUrl,
			{},
			{ headers: { Today: defaultDate } }
		);
		expect(response).toBeFalsy();
	});
});

function mocked200ApiResponse(data) {
	return {
		config: {},
		data: data,
		headers: {},
		request: {},
		status: 200,
		statusText: 'OK',
	};
}
