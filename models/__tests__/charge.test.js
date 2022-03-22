import Charge from '../charge.js';

describe('Constructor', () => {
	test('Minimum number of params', () => {
		let charge = new Charge('2022-02-01', 1000, 2, 1);

		expect(charge.date).toBe('2022-02-01');
		expect(charge.amount).toBe(1000);
		expect(charge.mandateId).toBe(2);
		expect(charge.advanceId).toBe(1);
		expect(charge.finalPayment).toBe(false);
		expect(charge.succeeded).toBe(false);
	});
	test('Override defaults if provide optional params', () => {
		let charge = new Charge('2022-02-01', 1000, 2, 1, true, true);

		expect(charge.date).toBe('2022-02-01');
		expect(charge.amount).toBe(1000);
		expect(charge.mandateId).toBe(2);
		expect(charge.advanceId).toBe(1);
		expect(charge.finalPayment).toBe(true);
		expect(charge.succeeded).toBe(true);
	});
});

describe('Mark as successful', () => {
	test('Update charge to successful when paid', () => {
		let charge = new Charge('2022-02-01', 1000, 2, 1);
		expect(charge.succeeded).toBe(false);

		charge.markAsSuccessful();

		expect(charge.succeeded).toBe(true);
	});
});
