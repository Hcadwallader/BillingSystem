import Customer from '../customer.js';
import Advance from '../advance.js';
import { expect } from '@jest/globals';

import { addDays } from '../../main.js';

jest.mock('../advance.js');

describe('Constructor', () => {
	test('Creates customer', () => {
		const customer = new Customer(1);
		expect(customer.id).toBe(1);
		expect(customer.advances).toBeInstanceOf(Map);
		expect(customer.revenue).toBeInstanceOf(Map);
		expect(customer.missingRevenue).toStrictEqual([]);
	});
});

describe('Get id', () => {
	test('Retrieves the correct customer id', () => {
		const customer = new Customer(1);
		const id = customer.getId(1);

		expect(id).toEqual(customer.id);
	});
});

describe('Add advance', () => {
	test('Adds advance to correct customer', () => {
		const advance = {
			id: 1,
			mandate_id: 2,
			repayment_percentage: 5,
			fee: 6000,
			total_advanced: 60000,
			repayment_start_date: '2022-02-01',
		};
		Advance.mockImplementation(() => {
			return { id: advance.id };
		});

		const customer = new Customer(4);
		expect(customer.advances).toBeInstanceOf(Map);
		customer.addAdvance(advance);

		expect(customer.advances.has(advance.id)).toBe(true);
		expect(customer.advances.get(advance.id)).toEqual(new Advance(advance));
	});
});

describe('Add revenue', () => {
	test('Adds a revenue to correct customer for the date passed in', () => {
		const customer = new Customer(4);

		expect(customer.revenue).toBeInstanceOf(Map);

		const date = '2022-02-01';
		const amount = 1000;
		customer.addRevenue(date, amount);

		expect(customer.revenue.has(date)).toBe(true);
		expect(customer.revenue.get(date)).toEqual(amount);
	});
});

describe('Process advances', () => {
	const date = '2022-02-01';
	const customer = new Customer(4);
	test('Get charge for advance for the correct customer', () => {
		Advance.mockImplementationOnce(() => {
			return {
				calculateCharge: () => {
					return 'new charge';
				},
			};
		}).mockImplementationOnce(() => {
			return {
				calculateCharge: () => {
					return 'another new charge';
				},
			};
		});
		customer.advances.set(1, new Advance());
		customer.advances.set(2, new Advance());
		customer.addRevenue(date, 10000);

		const chargeList = customer.processAdvances(date);

		expect(chargeList).toEqual(['new charge', 'another new charge']);
	});
	test('No revenue retrieved doesnt get charge', () => {
		customer.advances.set(1, new Advance());
		customer.advances.set(2, new Advance());
		customer.addRevenue(date, 10000);

		const chargeList = customer.processAdvances(addDays(date));

		expect(chargeList).toEqual([]);
	});

	test('Doesnt return charges that should be ignored', () => {
		Advance.mockImplementationOnce(() => {
			return {
				calculateCharge: () => {
					return 'good charge';
				},
			};
		})
			.mockImplementationOnce(() => {
				return {
					calculateCharge: () => {
						return null;
					},
				};
			})
			.mockImplementationOnce(() => {
				return {
					calculateCharge: () => {
						return false;
					},
				};
			});

		customer.advances.set(1, new Advance());
		customer.advances.set(2, new Advance());
		customer.advances.set(3, new Advance());
		customer.addRevenue(date, 10000);

		const chargeList = customer.processAdvances(date);
		expect(chargeList).toEqual(['good charge']);
	});
});

describe('Add missing revenue', () => {
	test('Adds new date to missing revenue list', () => {
		const customer = new Customer(4);
		const date = '2022-02-01';

		expect(customer.missingRevenue).toStrictEqual([]);

		customer.addMissingRevenue(date);

		expect(customer.missingRevenue).toContainEqual(date);
	});
	test('Date already in missing revenue list not added more than once', () => {
		const customer = new Customer(4);
		const date = '2022-02-01';

		expect(customer.missingRevenue).toStrictEqual([]);

		customer.addMissingRevenue(date);
		expect(customer.missingRevenue).toContainEqual(date);

		customer.addMissingRevenue(date);
		expect(customer.missingRevenue).toContainEqual(date);
	});
});

describe('Get failed charges', () => {
	test('Adds new date to missing revenue list', () => {
		const customer = new Customer(4);

		Advance.mockImplementationOnce(() => {
			return {
				getFailedChargesList: () => {
					return 'new charge';
				},
			};
		});
		customer.advances.set(1, new Advance());
		const chargeList = customer.getFailedCharges();

		expect(chargeList).toEqual(['new charge']);
	});
});
