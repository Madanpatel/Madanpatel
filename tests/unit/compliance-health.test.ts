import { describe, expect, it } from 'vitest'

function health(factors:{overdue:number;expired:number;missing:number;critical:number;verified:number}){
 return Math.max(0,Math.min(100,100-factors.overdue-factors.expired-factors.missing-factors.critical+factors.verified))
}

describe('compliance health',()=>{
 it('is bounded and transparent',()=>{
  expect(health({overdue:5,expired:4,missing:6,critical:3,verified:10})).toBe(92)
  expect(health({overdue:200,expired:0,missing:0,critical:0,verified:0})).toBe(0)
  expect(health({overdue:0,expired:0,missing:0,critical:0,verified:20})).toBe(100)
 })
})
