import { expect } from '@jest/globals';
import Advance from '../advance.js';
import Charge from '../charge.js';

describe('Constructor', () => {
	test('Minimum number of fields provided', () => {
		const advance = new Advance({
			id: 1,
			mandate_id: 2,
			repayment_percentage: 5,
			fee: 6000,
			total_advanced: 60000,
			repayment_start_date: '2022-02-01',
		});
		expect(advance.id).toBe(1);
		expect(advance.mandateId).toBe(2);
		expect(advance.totalOwed).toBe(66000);
		expect(advance.repaymentStartDate).toStrictEqual(
			new Date('2022-02-01')
		);
		expect(advance.repaymentPercentage).toBe(5);
		expect(advance.totalRemaining).toBe(66000);
		expect(advance.billingComplete).toBe(false);
		expect(advance.charges).toBeInstanceOf(Map);
		expect(advance.leftoverChargeAmount).toBe(0);
		expect(advance.failedCharges).toBeInstanceOf(Map);
	});
});
describe('Calculate charge', () => {
	test('Calculates charge correctly', () => {
		const advance = new Advance({
			id: 1,
			mandate_id: 2,
			repayment_percentage: 5,
			fee: 6000,
			total_advanced: 60000,
			repayment_start_date: '2022-02-01',
		});
		const date = new Date('2022-02-02');
		const revenue = 16000;
		expect(advance.calculateCharge(revenue, date)).toEqual(
			new Charge(date, '800.00', 2, 1)
		);
	});
	test('Marks final charge correctly', () => {
		const advance = new Advance({
			id: 1,
			mandate_id: 4,
			repayment_percentage: 10,
			fee: 100,
			total_advanced: 900,
			repayment_start_date: '2022-02-01',
		});
		const date = new Date('2022-02-02');
		const revenue = 10000;
		expect(advance.calculateCharge(revenue, date)).toEqual(
			new Charge(date, '1000.00', 4, 1, true)
		);
	});
	test('Charge does not exceed total amount owed', () => {
		const advance = new Advance({
			id: 1,
			mandate_id: 2,
			repayment_percentage: 10,
			fee: 100,
			total_advanced: 900,
			repayment_start_date: '2022-02-01',
		});
		const date = new Date('2022-02-02');
		const revenue = 100000;
		expect(advance.calculateCharge(revenue, date)).toEqual(
			new Charge(date, '1000.00', 2, 1, true)
		);
	});
	test('Charge only taken after repayment start date', () => {
		const advance = new Advance({
			id: 1,
			mandate_id: 2,
			repayment_percentage: 10,
			fee: 100,
			total_advanced: 900,
			repayment_start_date: '2022-02-05',
		});
		const date = new Date('2022-02-01');
		const revenue = 100000;
		expect(advance.calculateCharge(revenue, date)).toEqual(null);
	});
	test('No charge taken if advance already repaid', () => {
		const advance = new Advance({
			id: 1,
			mandate_id: 2,
			repayment_percentage: 10,
			fee: 100,
			total_advanced: 900,
			repayment_start_date: '2022-02-05',
		});
		const date = new Date('2022-02-01');
		const revenue = 100000;
		// first payment
		advance.calculateCharge(revenue, date);
		// second one shouldn't be taken
		expect(advance.calculateCharge(revenue, date)).toEqual(null);
	});
	test('Amount to be paid back over 10000', () => {
		const advance = new Advance({
			id: 1,
			mandate_id: 2,
			repayment_percentage: 10,
			fee: 4000,
			total_advanced: 40000,
			repayment_start_date: '2022-02-05',
		});
		const date = new Date('2022-02-06');
		const revenue = 110000;

		expect(advance.calculateCharge(revenue, date)).toEqual(
			new Charge(date, '10000.00', 2, 1)
		);
		const revenueSecondDay = 10000;
		const secondDay = new Date('2022-02-07');
		expect(advance.calculateCharge(revenueSecondDay, secondDay)).toEqual(
			new Charge(secondDay, '2000.00', 2, 1)
		);

		const revenueThirdDay = 10000;
		const thirdDay = new Date('2022-02-07');
		expect(advance.calculateCharge(revenueThirdDay, thirdDay)).toEqual(
			new Charge(thirdDay, '1000.00', 2, 1)
		);
	});
});

describe('Update billing complete', () => {
	test('Updates advance as complete for correct customer', () => {
		const advance = new Advance({
			id: 1,
			mandate_id: 2,
			repayment_percentage: 5,
			fee: 6000,
			total_advanced: 60000,
			repayment_start_date: '2022-02-01',
		});

		expect(advance.billingComplete).toBe(false);

		advance.updateBillingComplete();
	});
});

describe('Add failed charge to list', () => {
	test('Add new failed charge to list', () => {
		const date = '2022-02-01';
		const charge = new Charge(date, 1000, 2, 1);
		const advance = new Advance({
			id: 1,
			mandate_id: 2,
			repayment_percentage: 5,
			fee: 6000,
			total_advanced: 60000,
			repayment_start_date: date,
		});

		expect(advance.failedCharges.size).toEqual(0);

		advance.addFailedChargeToList(charge, date);
		expect(advance.failedCharges.size).toEqual(1);
		expect(advance.failedCharges.get(date)).toBe(charge);
	});
	test('Doesnt add existing failed charge to list', () => {
		const date = '2022-02-01';
		const charge = new Charge(date, 1000, 2, 1);
		const advance = new Advance({
			id: 1,
			mandate_id: 2,
			repayment_percentage: 5,
			fee: 6000,
			total_advanced: 60000,
			repayment_start_date: date,
		});

		expect(advance.failedCharges.size).toEqual(0);

		advance.addFailedChargeToList(charge, date);
		expect(advance.failedCharges.size).toEqual(1);
		expect(advance.failedCharges.get(date)).toBe(charge);

		advance.addFailedChargeToList(charge, date);
		expect(advance.failedCharges.size).toEqual(1);
		expect(advance.failedCharges.get(date)).toBe(charge);
	});
});

describe('Get failed charges list', () => {
	test('Get a list of failed charges', () => {
		const date = '2022-02-01';
		const charge = new Charge(date, 1000, 2, 1);
		const advance = new Advance({
			id: 1,
			mandate_id: 2,
			repayment_percentage: 5,
			fee: 6000,
			total_advanced: 60000,
			repayment_start_date: date,
		});

		expect(advance.failedCharges.size).toEqual(0);

		advance.addFailedChargeToList(charge, date);

		const chargeList = advance.getFailedChargesList();
		expect(chargeList.length).toEqual(1);
	});
});
