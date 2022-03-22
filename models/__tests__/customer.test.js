import Customer from '../customer.js';
import Advance from '../advance.js';

//jest.mock('../advance.js');

describe('Constructor', () => {
	test('Creates customer', () => {
		let customer = new Customer(1);
		expect(customer.id).toBe(1);
		expect(customer.advances).toBeInstanceOf(Map);
		expect(customer.revenue).toBeInstanceOf(Map);
	});
});

describe('Get id', () => {
	test('Returns id of provided customer', () => {
		let customer = new Customer(4);

		let customerId = customer.getId();

		expect(customerId).toBe(customer.id);
	});
});

describe('Add advance', () => {
	test('Adds advance to correct customer', () => {
		let customer = new Customer(4);

		expect(customer.advances).toBeInstanceOf(Map);

		let advance = {
			id: 1,
			mandate_id: 2,
			repayment_percentage: 5,
			fee: 6000,
			total_advanced: 60000,
			repayment_start_date: '2022-02-01',
		};

		customer.addAdvance(advance);

		expect(customer.advances.has(advance.id)).toBe(true);
		expect(customer.advances.get(advance.id)).toEqual(new Advance(advance));
	});
});

describe('Add revenue', () => {
	test('Adds a revenue to correct customer', () => {
		let customer = new Customer(4);

		expect(customer.revenue).toBeInstanceOf(Map);

		let date = '2022-02-01';
		let amount = 1000;
		customer.addRevenue(date, amount);

		expect(customer.revenue.has(date)).toBe(true);
		expect(customer.revenue.get(date)).toEqual(amount);
	});
});

describe('Get revenue', () => {
	test('Gets a revenue for the correct customer', () => {
		let customer = new Customer(4);

		expect(customer.revenue).toBeInstanceOf(Map);

		let date = '2022-02-01';
		let amount = 1000;
		customer.addRevenue(date, amount);
		let retrievedRevenue = customer.getRevenue(date);
		expect(retrievedRevenue).toBe(amount);
	});
});

// describe('Process todays advances', () => {

//     beforeEach(() => {
//         Advance.mockClear();
//       });
// 	test('Gets a revenue for the correct customer', () => {
// 		let customer = new Customer(4);
//         const mockAdvance = Advance.mock.instances[0];
//         const mockCalculateCharge = mockAdvance.calculateCharge;

//         let date = '2022-02-01';

//         let chargeList = customer.processTodaysAdvances(date)

//         expect(mockAdvance).toHaveBeenCalledWith(mockCalculateCharge);
//         expect(mockAdvance).toHaveBeenCalledTimes(2);

// 	});
// });
