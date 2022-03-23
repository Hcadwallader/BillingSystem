import { expect } from '@jest/globals';
import Advance from '../advance.js';
import Charge from '../charge.js';

describe('Constructor', () => {
	test('Minimum number of fields provided', () => {
		let advance = new Advance({
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
		let advance = new Advance({
			id: 1,
			mandate_id: 2,
			repayment_percentage: 5,
			fee: 6000,
			total_advanced: 60000,
			repayment_start_date: '2022-02-01',
		});
		let date = new Date('2022-02-02');
		let revenue = 16000;
		expect(advance.calculateCharge(revenue, date)).toEqual(
			new Charge(date, 800, 2, 1)
		);
	});
	test('Marks final charge correctly', () => {
		let advance = new Advance({
			id: 1,
			mandate_id: 4,
			repayment_percentage: 10,
			fee: 100,
			total_advanced: 900,
			repayment_start_date: '2022-02-01',
		});
		let date = new Date('2022-02-02');
		let revenue = 10000;
		expect(advance.calculateCharge(revenue, date)).toEqual(
			new Charge(date, 1000, 4, 1, true)
		);
	});
	test('Charge does not exceed total amount owed', () => {
		let advance = new Advance({
			id: 1,
			mandate_id: 2,
			repayment_percentage: 10,
			fee: 100,
			total_advanced: 900,
			repayment_start_date: '2022-02-01',
		});
		let date = new Date('2022-02-02');
		let revenue = 100000;
		expect(advance.calculateCharge(revenue, date)).toEqual(
			new Charge(date, 1000, 2, 1, true)
		);
	});
	test('Charge only taken after repayment start date', () => {
		let advance = new Advance({
			id: 1,
			mandate_id: 2,
			repayment_percentage: 10,
			fee: 100,
			total_advanced: 900,
			repayment_start_date: '2022-02-05',
		});
		let date = new Date('2022-02-01');
		let revenue = 100000;
		expect(advance.calculateCharge(revenue, date)).toEqual(null);
	});
	test('No charge taken if advance already repaid', () => {
		let advance = new Advance({
			id: 1,
			mandate_id: 2,
			repayment_percentage: 10,
			fee: 100,
			total_advanced: 900,
			repayment_start_date: '2022-02-05',
		});
		let date = new Date('2022-02-01');
		let revenue = 100000;
		// first payment
		advance.calculateCharge(revenue, date);
		// second one shouldn't be taken
		expect(advance.calculateCharge(revenue, date)).toEqual(null);
	});
	test('Amount to be paid back over 10000', () => {
		let advance = new Advance({
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
			new Charge(date, 10000, 2, 1)
		);
		const revenueSecondDay = 10000;
		const secondDay = new Date('2022-02-07');
		expect(advance.calculateCharge(revenueSecondDay, secondDay)).toEqual(
			new Charge(secondDay, 2000, 2, 1)
		);

		const revenueThirdDay = 10000;
		const thirdDay = new Date('2022-02-07');
		expect(advance.calculateCharge(revenueThirdDay, thirdDay)).toEqual(
			new Charge(thirdDay, 1000, 2, 1)
		);
	});
});

describe('Update billing complete', () => {
	test('Updates advance as complete for correct customer', () => {
		let advance = new Advance({
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
		let date = '2022-02-01';
		let charge = new Charge(date, 1000, 2, 1);
		let advance = new Advance({
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
		let date = '2022-02-01';
		let charge = new Charge(date, 1000, 2, 1);
		let advance = new Advance({
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
	test('Updates advance as complete for correct customer', () => {
		let date = '2022-02-01';
		let charge = new Charge(date, 1000, 2, 1);
		let advance = new Advance({
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
		expect(chargeList.size).toEqual(1);
		expect(chargeList.get(date)).toBe(charge);
	});
});