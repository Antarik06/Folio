import { describe, it, expect } from 'vitest'
import { formatPrice, getShippingAddressErrors, getStatusLabel, ShippingAddress } from '../../lib/pricing'

describe('pricing library tests', () => {
  it('formats cents price correctly into INR string', () => {
    expect(formatPrice(1000)).toBe('Rs. 10')
    expect(formatPrice(149900)).toBe('Rs. 1,499')
    expect(formatPrice(0)).toBe('Rs. 0')
  })

  it('validates empty shipping address and returns error fields', () => {
    const emptyAddress: ShippingAddress = {
      fullName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: '',
    }
    const errors = getShippingAddressErrors(emptyAddress)
    expect(errors.fullName).toBe('Full name is required.')
    expect(errors.addressLine1).toBe('Address is required.')
    expect(errors.city).toBe('City is required.')
    expect(errors.state).toBe('State is required.')
    expect(errors.phone).toBe('Phone number is required.')
    expect(errors.postalCode).toBe('Postal code is required.')
  })

  it('accepts valid shipping address with no errors', () => {
    const validAddress: ShippingAddress = {
      fullName: 'John Doe',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
      phone: '9876543210',
    }
    const errors = getShippingAddressErrors(validAddress)
    expect(Object.keys(errors).length).toBe(0)
  })

  it('returns human-readable order status labels', () => {
    expect(getStatusLabel('pending')).toBe('Order placed')
    expect(getStatusLabel('paid')).toBe('Payment confirmed')
    expect(getStatusLabel('shipped')).toBe('On its way')
  })
})
