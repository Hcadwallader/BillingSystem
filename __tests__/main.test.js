import {
	billingComplete,
	getAdvances,
	getRevenue,
	issueCharge,
} from '../services/apiClient.js';
import Customer from '../models/customer.js';
import {
	customers,
	runBilling,
	processNewAdvances,
	processRevenue,
	getCustomer,
	getDates,
} from '../main.js';

jest.mock('../services/apiClient.js');

const date = new Date('2022-02-02');

beforeEach(() => {
	customers.clear();
	getAdvances.mockClear();
	getRevenue.mockClear();
	issueCharge.mockClear();
	billingComplete.mockClear();
});

describe('Get dates', () => {
	test('Gets an array of all the dates between two dates', () => {
		const dateArray = getDates(
			new Date('2022-01-02'),
			new Date('2022-01-06')
		);

		const expected = [
			'2022-01-02',
			'2022-01-03',
			'2022-01-04',
			'2022-01-05',
		];

		expect(dateArray.length).toEqual(4);
		expect(dateArray).toEqual(expected);
	});
});

describe('Get customer', () => {
	test('Gets an existing customer', () => {
		const customer = new Customer(1);
		customer.advances.set(1, {});
		customers.set(1, customer);

		const response = getCustomer(1);

		expect(response).toEqual(customer);
	});

	test('Creates a new customer', () => {
		expect(customers.size).toEqual(0);

		const response = getCustomer(1);

		expect(response).toBeTruthy();
	});
});

describe('Process new advances', () => {
	test('No advances provided', async () => {
		expect(customers.size).toEqual(0);

		processNewAdvances([], new Date('2022-02-02'));

		expect(getAdvances).toBeCalledTimes(0);
		expect(customers.size).toEqual(0);
	});

	test('Multiple advances provided', async () => {
		expect(customers.size).toEqual(0);

		let customer1Advance1 = defaultAdvance();
		customer1Advance1.id = 1;
		customer1Advance1.customer_id = 1;
		let customer1Advance2 = defaultAdvance();
		customer1Advance2.id = 2;
		customer1Advance2.customer_id = 1;
		let customer2Advance3 = defaultAdvance();
		customer2Advance3.id = 3;
		customer2Advance3.customer_id = 2;

		processNewAdvances(
			[customer1Advance1, customer1Advance2, customer2Advance3],
			new Date('2022-02-02')
		);

		expect(getAdvances).toBeCalledTimes(0);
		expect(customers.size).toEqual(2);
		expect(customers.get(1).getAdvance(1)).toBeTruthy();
		expect(customers.get(1).getAdvance(2)).toBeTruthy();
		expect(customers.get(2).getAdvance(3)).toBeTruthy();
	});
});

describe('Process revenue', () => {
	test('Gets todays revenue', async () => {
		getRevenue.mockReturnValueOnce(Promise.resolve({ amount: 10000 }));

		const id = 2;
		let chargeList = [];
		let customer = new Customer(id);
		customers.set(id, customer);
		expect(getCustomer(id).revenue.size).toEqual(0);

		chargeList = await processRevenue(id, date, chargeList);

		expect(getRevenue).toBeCalledTimes(1);
		expect(getCustomer(id).revenue.size).toEqual(1);
		expect(chargeList.length).toEqual(1);
	});

	test('Gets missing revenues', async () => {
		getRevenue
			.mockReturnValueOnce(Promise.resolve({ amount: 10000 }))
			.mockReturnValueOnce(Promise.resolve({ amount: 7000 }))
			.mockReturnValueOnce(Promise.resolve({ amount: 8500 }));

		const id = 2;
		let chargeList = [];
		let customer = new Customer(id);
		customer.addMissingRevenue(date.getDate() - 1);
		customer.addMissingRevenue(date.getDate() - 2);
		customers.set(id, customer);
		expect(getCustomer(id).revenue.size).toEqual(0);

		chargeList = await processRevenue(id, date, chargeList);

		expect(getRevenue).toBeCalledTimes(3);

		expect(getCustomer(id).revenue.size).toEqual(3);
		expect(getCustomer(id).revenue.get(date)).toEqual(8500);
		expect(getCustomer(id).revenue.get(date.getDate() - 1)).toEqual(10000);
		expect(getCustomer(id).revenue.get(date.getDate() - 2)).toEqual(7000);
		expect(chargeList.length).toEqual(3);
	});
});

describe('Run billing', () => {
	test('Handles single advance starting in the future', async () => {
		getAdvances.mockReturnValueOnce(Promise.resolve([defaultAdvance()]));

		runBilling(new Date('2022-03-02'));

		// check the right variable is passed in
		expect(getAdvances).toBeCalledTimes(1);
		const call = getAdvances.mock.calls[0]; // will give you the first call to the mock
		expect(call[0]).toMatchObject(new Date('2022-03-02'));

		// check no other API calls are made
		expect(getRevenue).toBeCalledTimes(0);
		expect(issueCharge).toBeCalledTimes(0);
		expect(billingComplete).toBeCalledTimes(0);
	});

	// test('Handles single advance that already needs repaying', async () => {
	//
	//     const todaysDate = new Date('2022-02-02')
	//
	//     getAdvances.mockReturnValueOnce(Promise.resolve([defaultAdvance()]));
	//     getRevenue.mockReturnValueOnce(Promise.resolve({"amount": 10000}));
	//     issueCharge.mockReturnValueOnce(Promise.resolve(true));
	//
	//     runBilling(todaysDate)
	//
	//     // check the right variable is passed in
	//     expect(getAdvances).toBeCalledTimes(1);
	//     const advanceCall = getAdvances.mock.calls[0] // will give you the first call to the mock
	//     expect(advanceCall[0]).toMatchObject(todaysDate)
	//
	//     expect(getRevenue).toBeCalledTimes(1);
	//     const revenueCall = getRevenue.mock.calls[0] // will give you the first call to the mock
	//     expect(revenueCall[0]).toMatchObject(defaultCustomerId)
	//     expect(revenueCall[1]).toMatchObject(todaysDate)
	//
	//     expect(issueCharge).toBeCalledTimes(1);
	//     const chargeCall = issueCharge.mock.calls[0] // will give you the first call to the mock
	//     expect(chargeCall[0]).toMatchObject(defaultMandateId)
	//     expect(chargeCall[1]).toMatchObject(6600)
	//     expect(chargeCall[2]).toMatchObject(todaysDate)
	//
	//     expect(billingComplete).toBeCalledTimes(0);
	// });
});

const defaultCustomerId = 4;
const defaultMandateId = 21;
const defaultAdvance = () => {
	return {
		id: 123,
		mandate_id: defaultMandateId,
		customer_id: defaultCustomerId,
		repayment_percentage: 10,
		fee: 6000,
		total_advanced: 60000,
		repayment_start_date: '2022-02-01',
	};
};

let revenue = new Map();
revenue.set(new Date('2022-01-01'), 2000);
revenue.set(new Date('2022-01-02'), 2000);
revenue.set(new Date('2022-01-03'), 2000);
revenue.set(new Date('2022-01-04'), 2000);
revenue.set(new Date('2022-01-05'), 2000);

let charges = new Map();
charges;
