'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Trash2, 
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  X,
  Calendar,
  Edit
} from 'lucide-react'

// 排产相关接口
interface CustomerOrder {
  order_id: string
  customer_name: string
  product_code: string
  quantity: number
  due_date: string
  priority: number
  order_date: string
  unit_price: number
}

interface CustomerOrderForm extends CustomerOrder {
  id: string
}

interface OrderManagementProps {
  orders: CustomerOrderForm[]
  setOrders: (orders: CustomerOrderForm[]) => void
  totalQuantity: number
  totalValue: number
  customerCount: number
  formatCurrency: (amount: number) => string
  removeOrder: (id: string) => void
  updateOrder: (id: string, field: keyof CustomerOrder, value: any) => void
}

export default function OrderManagement({
  orders,
  setOrders,
  totalQuantity,
  totalValue,
  customerCount,
  formatCurrency,
  removeOrder,
  updateOrder
}: OrderManagementProps) {
  // Modal相关状态
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CustomerOrder>({
    order_id: '',
    customer_name: '',
    product_code: '',
    quantity: 0,
    due_date: '',
    priority: 1,
    order_date: new Date().toISOString().split('T')[0],
    unit_price: 0
  })
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  // 生成新的订单ID
  const generateOrderId = () => {
    return `ORD-${(orders.length + 1).toString().padStart(3, '0')}`
  }

  // 打开添加订单modal
  const openAddModal = () => {
    setIsEditing(false)
    setEditingOrderId(null)
    setFormData({
      order_id: generateOrderId(),
      customer_name: '',
      product_code: '',
      quantity: 0,
      due_date: '',
      priority: 1,
      order_date: new Date().toISOString().split('T')[0],
      unit_price: 0
    })
    setFormErrors({})
    setShowModal(true)
  }

  // 打开编辑订单modal
  const openEditModal = (order: CustomerOrderForm) => {
    setIsEditing(true)
    setEditingOrderId(order.id)
    setFormData({
      order_id: order.order_id,
      customer_name: order.customer_name,
      product_code: order.product_code,
      quantity: order.quantity,
      due_date: order.due_date,
      priority: order.priority,
      order_date: order.order_date,
      unit_price: order.unit_price
    })
    setFormErrors({})
    setShowModal(true)
  }

  // 关闭modal
  const closeModal = () => {
    setShowModal(false)
    setIsEditing(false)
    setEditingOrderId(null)
    setFormData({
      order_id: '',
      customer_name: '',
      product_code: '',
      quantity: 0,
      due_date: '',
      priority: 1,
      order_date: new Date().toISOString().split('T')[0],
      unit_price: 0
    })
    setFormErrors({})
  }

  // 表单验证
  const validateForm = () => {
    const errors: {[key: string]: string} = {}
    
    if (!formData.order_id.trim()) {
      errors.order_id = '订单编号不能为空'
    }
    if (!formData.customer_name.trim()) {
      errors.customer_name = '客户名称不能为空'
    }
    if (!formData.product_code.trim()) {
      errors.product_code = '产品编码不能为空'
    }
    if (formData.quantity <= 0) {
      errors.quantity = '数量必须大于0'
    }
    if (!formData.due_date) {
      errors.due_date = '交期不能为空'
    }
    if (formData.unit_price < 0) {
      errors.unit_price = '单价不能为负数'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // 提交表单
  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    if (isEditing && editingOrderId) {
      // 更新现有订单
      const updatedOrders = orders.map(order => 
        order.id === editingOrderId 
          ? { ...order, ...formData }
          : order
      )
      setOrders(updatedOrders)
    } else {
      // 添加新订单
      const newOrder: CustomerOrderForm = {
        ...formData,
        id: Date.now().toString()
      }
      setOrders([...orders, newOrder])
    }
    
    closeModal()
  }

  // 更新表单数据
  const updateFormData = (field: keyof CustomerOrder, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // 清除对应字段的错误
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  // 获取优先级标签样式
  const getPriorityVariant = (priority: number) => {
    switch (priority) {
      case 1: return 'destructive'
      case 2: return 'default' 
      case 3: return 'secondary'
      default: return 'default'
    }
  }

  // 获取优先级文字
  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return '高'
      case 2: return '中'
      case 3: return '低'
      default: return '中'
    }
  }

  return (
    <div className="space-y-8">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">总订单数</p>
                <p className="text-2xl font-bold text-blue-900">{orders.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">总数量</p>
                <p className="text-2xl font-bold text-green-900">{totalQuantity}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">客户数</p>
                <p className="text-2xl font-bold text-orange-900">{customerCount}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">总价值</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 订单表格 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>订单列表</CardTitle>
            <CardDescription>管理客户订单和生产需求</CardDescription>
          </div>
          <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            添加订单
          </Button>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无订单</h3>
              <p className="text-gray-500 mb-4">点击"添加订单"开始创建第一个订单</p>
              <Button onClick={openAddModal} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                添加订单
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">订单编号</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">客户名称</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">产品编码</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">数量</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">交期</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">单价</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">总价</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">优先级</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium">{order.order_id}</td>
                      <td className="px-4 py-3">{order.customer_name}</td>
                      <td className="px-4 py-3">{order.product_code}</td>
                      <td className="px-4 py-3">{order.quantity}</td>
                      <td className="px-4 py-3">{order.due_date}</td>
                      <td className="px-4 py-3">¥{order.unit_price.toFixed(2)}</td>
                      <td className="px-4 py-3 font-medium text-green-600">
                        {formatCurrency(order.quantity * (order.unit_price ?? 0))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getPriorityVariant(order.priority)}>
                          {getPriorityText(order.priority)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(order)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOrder(order.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* shadcn-ui Dialog Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isEditing ? '编辑订单' : '添加新订单'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? '修改订单详细信息' : '填写订单详细信息'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* 订单基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_id">订单编号 *</Label>
                <Input
                  id="order_id"
                  value={formData.order_id}
                  onChange={(e) => updateFormData('order_id', e.target.value)}
                  placeholder="输入订单编号"
                  className={formErrors.order_id ? 'border-red-500' : ''}
                />
                {formErrors.order_id && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.order_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_name">客户名称 *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => updateFormData('customer_name', e.target.value)}
                  placeholder="输入客户名称"
                  className={formErrors.customer_name ? 'border-red-500' : ''}
                />
                {formErrors.customer_name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.customer_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_code">产品编码 *</Label>
                <Select 
                  value={formData.product_code} 
                  onValueChange={(value) => updateFormData('product_code', value)}
                >
                  <SelectTrigger className={formErrors.product_code ? 'border-red-500' : ''}>
                    <SelectValue placeholder="选择产品编码" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C1B010000036">C1B010000036</SelectItem>
                    <SelectItem value="C1B010000037">C1B010000037</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.product_code && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.product_code}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">数量 *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity || ''}
                  onChange={(e) => updateFormData('quantity', parseInt(e.target.value) || 0)}
                  placeholder="输入数量"
                  className={formErrors.quantity ? 'border-red-500' : ''}
                />
                {formErrors.quantity && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.quantity}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">交期 *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => updateFormData('due_date', e.target.value)}
                  className={formErrors.due_date ? 'border-red-500' : ''}
                />
                {formErrors.due_date && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.due_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_price">单价</Label>
                <Input
                  id="unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_price || ''}
                  onChange={(e) => updateFormData('unit_price', parseFloat(e.target.value) || 0)}
                  placeholder="输入单价"
                  className={formErrors.unit_price ? 'border-red-500' : ''}
                />
                {formErrors.unit_price && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.unit_price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <Select value={formData.priority.toString()} onValueChange={(value) => updateFormData('priority', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">高优先级</SelectItem>
                    <SelectItem value="2">中优先级</SelectItem>
                    <SelectItem value="3">低优先级</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_date">订单日期</Label>
                <Input
                  id="order_date"
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => updateFormData('order_date', e.target.value)}
                />
              </div>
            </div>

            {/* 订单预览 */}
            <div className="bg-muted/50 rounded-lg p-4 border">
              <h3 className="font-medium text-foreground mb-3 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                订单预览
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">订单总价：</span>
                  <span className="font-medium text-green-600 ml-2">
                    {formatCurrency(formData.quantity * (formData.unit_price || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">优先级：</span>
                  <Badge variant={getPriorityVariant(formData.priority)} className="ml-2">
                    {getPriorityText(formData.priority)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? '更新订单' : '添加订单'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 