var ObjectManage = require('../lib/ObjectManage')
describe.only('ObjectManage',function(){
  var data1 = {test1: 'val1', test2: 'val2'}
    , data2 = {test3: 'val3', test4: 'val4'}
    , data3 = {test5: {test6: 'val6'}}
  it('should accept data to the constructor',function(){
    var obj = new ObjectManage(data1)
    expect(obj.data.test1).to.equal('val1')
    expect(obj.data.test2).to.equal('val2')
  })
  it('should be able to merge in data after constructing',function(){
    var obj = new ObjectManage([data1,data2])
    expect(obj.data.test3).to.equal('val3')
    expect(obj.data.test4).to.equal('val4')
  })
  it('should be able to get a nested key',function(){
    var obj = new ObjectManage([data1,data3])
    expect(obj.get('test5.test6')).to.equal('val6')
  })
  it('should be able to set a nested key',function(){
    var obj = new ObjectManage([data1,data3])
    obj.set('test5.test7','val7')
    expect(obj.data.test5.test7).to.equal('val7')
  })
  it('should overwrite a key to object if nested below',function(){
    var obj = new ObjectManage([data1,data2,data3])
    obj.set('test5.test6.new','val8')
    expect(obj.data.test5.test6.new).to.equal('val8')
  })
  it('should returned undefined on a missing key',function(){
    var obj = new ObjectManage(data1)
    expect(obj.get('test5.test6')).to.equal(undefined)
  })
})