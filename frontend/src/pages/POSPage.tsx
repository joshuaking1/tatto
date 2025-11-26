import React, { useState, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  User as UserIcon,
  Clock,
  Package,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

import { createSale, type CreateSaleDto, type SaleItemInput, type PaymentInput } from '@/services/salesService';
import { getAllServices } from '@/services/servicesService';
import { getAllInventoryItems } from '@/services/inventoryService';
import { getAllCustomers, createCustomer, type CreateCustomerDto } from '@/services/customersService';
import { getAppointmentsByCustomer } from '@/services/appointmentsService';
import { PaymentMethod, type Service, type InventoryItem, type User } from '@/types';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export function POSPage() {
  const navigate = useNavigate();

  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<SaleItemInput[]>([]);
  const [payments, setPayments] = useState<PaymentInput[]>([]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(15);
  const [notes, setNotes] = useState('');
  const [appointmentId, setAppointmentId] = useState<string>('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [quickAddCustomerOpen, setQuickAddCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<CreateCustomerDto>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: getAllServices,
  });

  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: getAllInventoryItems,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: getAllCustomers,
  });

  const { data: customerAppointments } = useQuery({
    queryKey: ['customer-appointments', selectedCustomer?.id],
    queryFn: () => selectedCustomer ? getAppointmentsByCustomer(selectedCustomer.id) : [],
    enabled: !!selectedCustomer,
  });

  const createSaleMutation = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      toast.success('Sale processed successfully!');
      // Reset cart
      setCartItems([]);
      setPayments([]);
      setDiscount(0);
      setNotes('');
      setSelectedCustomer(null);
      setAppointmentId('');
      navigate('/sales');
    },
    onError: (error) => {
      toast.error(`Failed to process sale: ${error}`);
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (customer) => {
      toast.success('Customer created successfully!');
      setSelectedCustomer(customer);
      setQuickAddCustomerOpen(false);
      setNewCustomer({ email: '', firstName: '', lastName: '', phone: '' });
    },
    onError: (error) => {
      toast.error(`Failed to create customer: ${error}`);
    },
  });

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  const taxAmount = useMemo(() => {
    return Math.max(0, (subtotal - discount) * taxRate / 100);
  }, [subtotal, discount, taxRate]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount + taxAmount);
  }, [subtotal, discount, taxAmount]);

  const paidAmount = useMemo(() => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  }, [payments]);

  const remainingBalance = useMemo(() => {
    return Math.max(0, total - paidAmount);
  }, [total, paidAmount]);

  const addToCart = (item: Service | InventoryItem, type: 'SERVICE' | 'INVENTORY') => {
    const existingItem = cartItems.find(
      (cartItem) => cartItem.itemId === item.id && cartItem.type === type
    );

    if (existingItem) {
      setCartItems(
        cartItems.map((cartItem) =>
          cartItem.itemId === item.id && cartItem.type === type
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      const newItem: SaleItemInput = {
        type,
        itemId: item.id,
        quantity: 1,
        name: item.name,
        price: 'basePrice' in item ? item.basePrice : item.unitPrice,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateCartItemQuantity = (itemId: string, type: 'SERVICE' | 'INVENTORY', quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId, type);
    } else {
      setCartItems(
        cartItems.map((item) =>
          item.itemId === itemId && item.type === type
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const removeFromCart = (itemId: string, type: 'SERVICE' | 'INVENTORY') => {
    setCartItems(cartItems.filter((item) => !(item.itemId === itemId && item.type === type)));
  };

  const addPayment = (payment: PaymentInput) => {
    setPayments([...payments, payment]);
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const handleProcessSale = () => {
    if (!selectedCustomer || cartItems.length === 0 || remainingBalance > 0) {
      toast.error('Please complete all required fields and ensure payments cover the total.');
      return;
    }

    const saleData: CreateSaleDto = {
      customerUserId: selectedCustomer.id,
      appointmentId: appointmentId || undefined,
      items: cartItems.map((item) => ({
        type: item.type,
        itemId: item.itemId,
        quantity: item.quantity,
      })),
      payments: payments,
      discountAmount: discount > 0 ? discount : undefined,
      taxRate: taxRate > 0 ? taxRate / 100 : undefined,
      notes: notes || undefined,
    };

    createSaleMutation.mutate(saleData);
  };

  const handleQuickAddCustomer = () => {
    createCustomerMutation.mutate(newCustomer);
  };

  const filteredServices = services?.filter((service) =>
    service.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const filteredInventory = inventoryItems?.filter((item) =>
    item.name.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CARD:
        return <CreditCard className="h-4 w-4" />;
      case PaymentMethod.CASH:
        return <Banknote className="h-4 w-4" />;
      case PaymentMethod.MOBILE_MONEY:
        return <Smartphone className="h-4 w-4" />;
      case PaymentMethod.BANK_TRANSFER:
        return <Building className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  return (
    <PermissionGuard 
      permission="sale:create"
      fallback={
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
            <p className="text-gray-600 mt-2">You don't have permission to access the Point of Sale.</p>
          </div>
        </div>
      }
    >
      <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Point of Sale</h1>
        <p className="text-gray-600">{format(new Date(), 'PPP p')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Item Selection */}
        <div className="space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select
                  value={selectedCustomer?.id || ''}
                  onValueChange={(value) => {
                    const customer = customers?.find((c) => c.id === value);
                    setSelectedCustomer(customer || null);
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={quickAddCustomerOpen} onOpenChange={setQuickAddCustomerOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Quick Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Quick Add Customer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="First Name"
                        value={newCustomer.firstName}
                        onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                      />
                      <Input
                        placeholder="Last Name"
                        value={newCustomer.lastName}
                        onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      />
                      <Input
                        placeholder="Phone"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      />
                      <Button
                        onClick={handleQuickAddCustomer}
                        disabled={createCustomerMutation.isPending}
                        className="w-full"
                      >
                        {createCustomerMutation.isPending ? 'Creating...' : 'Create Customer'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {selectedCustomer && (
                <div className="text-sm text-gray-600">
                  Selected: {selectedCustomer.firstName} {selectedCustomer.lastName}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Item Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Add Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="services" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="services">Services</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                </TabsList>
                <TabsContent value="services" className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search services..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="grid gap-3 max-h-64 overflow-y-auto">
                    {filteredServices?.map((service) => (
                      <Card key={service.id} className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{service.name}</h4>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.duration}min
                            </p>
                            <p className="text-sm font-medium">${service.basePrice.toFixed(2)}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addToCart(service, 'SERVICE')}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="inventory" className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search inventory..."
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="grid gap-3 max-h-64 overflow-y-auto">
                    {filteredInventory?.map((item) => (
                      <Card key={item.id} className="p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              Stock: {item.quantity}
                            </p>
                            <p className="text-sm font-medium">${item.unitPrice.toFixed(2)}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addToCart(item, 'INVENTORY')}
                            disabled={item.quantity === 0}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Cart & Checkout */}
        <div className="space-y-6">
          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          <Badge variant={item.type === 'SERVICE' ? 'default' : 'secondary'}>
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartItemQuantity(
                                item.itemId,
                                item.type,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-16 h-8"
                          />
                        </TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.itemId, item.type)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Calculations */}
          <Card>
            <CardHeader>
              <CardTitle>Calculations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <label>Discount:</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24"
                />
              </div>
              <div className="flex items-center gap-2">
                <label>Tax Rate:</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-16"
                />
                <span>%</span>
              </div>
              <div className="flex justify-between">
                <span>Tax Amount:</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddPaymentForm onAddPayment={addPayment} remainingBalance={remainingBalance} />
              
              {payments.map((payment, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {getPaymentIcon(payment.method)}
                    <span>{payment.method}</span>
                    {payment.transactionId && (
                      <span className="text-sm text-gray-500">ID: {payment.transactionId}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>${payment.amount.toFixed(2)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePayment(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span>Paid Amount:</span>
                  <span>${paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Remaining Balance:</span>
                  <span className={remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                    ${remainingBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Selection */}
          {selectedCustomer && (
            <Card>
              <CardHeader>
                <CardTitle>Link Appointment (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={appointmentId}
                  onValueChange={setAppointmentId}
                  disabled={!customerAppointments || customerAppointments.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an appointment (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerAppointments?.map((appointment) => (
                      <SelectItem key={appointment.id} value={appointment.id}>
                        {format(new Date(appointment.startTime), 'MMM dd, yyyy HH:mm')} - {appointment.service?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {customerAppointments && customerAppointments.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No appointments found for this customer</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any notes about this sale..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Process Sale */}
          <Button
            onClick={handleProcessSale}
            disabled={!selectedCustomer || cartItems.length === 0 || remainingBalance > 0 || createSaleMutation.isPending}
            className="w-full"
            size="lg"
          >
            {createSaleMutation.isPending ? 'Processing...' : 'Process Sale'}
          </Button>
        </div>
      </div>
    </div>
    </PermissionGuard>
  );
}

interface AddPaymentFormProps {
  onAddPayment: (payment: PaymentInput) => void;
  remainingBalance: number;
}

function AddPaymentForm({ onAddPayment, remainingBalance }: AddPaymentFormProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [transactionId, setTransactionId] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAddPayment = () => {
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return;
    }

    onAddPayment({
      amount: paymentAmount,
      method,
      transactionId: method !== PaymentMethod.CASH ? transactionId : undefined,
    });

    setAmount('');
    setTransactionId('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={remainingBalance.toFixed(2)}
            />
            <p className="text-xs text-gray-500">Remaining balance: ${remainingBalance.toFixed(2)}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Payment Method</label>
            <Select value={method} onValueChange={(value) => setMethod(value as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                <SelectItem value={PaymentMethod.CARD}>Card</SelectItem>
                <SelectItem value={PaymentMethod.MOBILE_MONEY}>Mobile Money</SelectItem>
                <SelectItem value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {method !== PaymentMethod.CASH && (
            <div>
              <label className="text-sm font-medium">Transaction ID (Optional)</label>
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID"
              />
            </div>
          )}
          <Button onClick={handleAddPayment} className="w-full">
            Add Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
