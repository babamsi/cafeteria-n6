"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  History,
  Settings,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Users,
  UtensilsCrossed,
  FileText,
  CheckCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCompletePOSStore, useCompletePOSStore as usePOSStore } from "@/stores/complete-pos-store"
import { useOrdersStore } from "@/stores/orders-store"
import type { MenuItem, CartItem } from "@/types/unified-system"
import Image from "next/image"

interface TableState {
  id: number
  number: string
  status: "available" | "occupied" | "needs-cleaning"
  orderId?: string
  pax: number
}

export function CorrectedPOSSystem() {
  const { toast } = useToast()
  const {
    menuItems,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    updateOrder,
    getCartTotal,
    getCartItemCount,
    getAvailableMenuItems,
    loadCart,
    updateOrderStatus,
  } = useCompletePOSStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showHistory, setShowHistory] = useState(false)
  const { orders: allOrders } = useOrdersStore()

  const [tables, setTables] = useState<TableState[]>(
    Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      number: `T${i + 1}`,
      status: "available",
      pax: 0,
    })),
  )
  const [selectedTable, setSelectedTable] = useState<TableState | null>(null)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)

  const [isCustomizing, setIsCustomizing] = useState(false)
  const [customizingItem, setCustomizingItem] = useState<{ menuItem: MenuItem; portionSize?: string } | null>(null)
  const [customizationNotes, setCustomizationNotes] = useState("")

  const [showTableOptions, setShowTableOptions] = useState<null | TableState>(null)
  const [showPayment, setShowPayment] = useState<null | { table: TableState; orderId: string }>(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Default nutrition info for sample items
  const defaultNutrition = { calories: 100, protein: 2, carbs: 20, fat: 3, fiber: 1, sodium: 100 }
  // Sample menu items with categories and subcategories (add subcategory as extra property for grouping)
  const sampleMenuItems: (MenuItem & { subcategory?: string })[] = [
    { id: "1", name: "Spring Rolls", price: 5, category: "Starters", available_quantity: 10, description: "Crispy rolls", type: "individual", nutrition: defaultNutrition },
    { id: "2", name: "Garlic Bread", price: 4, category: "Starters", available_quantity: 8, description: "Buttery bread", type: "individual", nutrition: defaultNutrition },
    { id: "3", name: "Margherita Pizza", price: 12, category: "Main Course", available_quantity: 5, description: "Classic pizza", type: "recipe", nutrition: defaultNutrition, subcategory: "Pizza" },
    { id: "4", name: "Pepperoni Pizza", price: 14, category: "Main Course", available_quantity: 3, description: "Spicy pepperoni", type: "recipe", nutrition: defaultNutrition, subcategory: "Pizza" },
    { id: "5", name: "Spaghetti Bolognese", price: 13, category: "Main Course", available_quantity: 6, description: "Rich meat sauce", type: "recipe", nutrition: defaultNutrition, subcategory: "Pasta" },
    { id: "6", name: "Fettuccine Alfredo", price: 13, category: "Main Course", available_quantity: 4, description: "Creamy sauce", type: "recipe", nutrition: defaultNutrition, subcategory: "Pasta" },
    { id: "7", name: "Coke", price: 2, category: "Drinks", available_quantity: 20, description: "Chilled soda", type: "individual", nutrition: defaultNutrition },
    { id: "8", name: "Orange Juice", price: 3, category: "Drinks", available_quantity: 15, description: "Fresh juice", type: "individual", nutrition: defaultNutrition },
  ]

  // Use sampleMenuItems for demonstration (replace with menuItems for real data)
  const menuToShow = sampleMenuItems

  // Group menu items by category and subcategory
  const groupedMenu = menuToShow.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = {}
    const subcat = (item as any).subcategory || "__no_sub__"
    if (!acc[item.category][subcat]) acc[item.category][subcat] = []
    acc[item.category][subcat].push(item)
    return acc
  }, {} as Record<string, Record<string, (MenuItem & { subcategory?: string })[]>>)

  const categories = ["All", ...Object.keys(groupedMenu)]

  // Filtered menu by search/category
  const filteredGroupedMenu = Object.entries(groupedMenu).reduce((acc, [category, subcats]) => {
    if (selectedCategory !== "All" && category !== selectedCategory) return acc
    const filteredSubcats: Record<string, (MenuItem & { subcategory?: string })[]> = {}
    Object.entries(subcats).forEach(([subcat, items]) => {
      const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      if (filteredItems.length > 0) filteredSubcats[subcat] = filteredItems
    })
    if (Object.keys(filteredSubcats).length > 0) acc[category] = filteredSubcats
    return acc
  }, {} as Record<string, Record<string, (MenuItem & { subcategory?: string })[]>>)

  const handleOpenCustomization = (menuItem: MenuItem, portionSize?: string) => {
    setCustomizingItem({ menuItem, portionSize })
    setIsCustomizing(true)
  }

  const handleConfirmAddToCart = () => {
    if (!customizingItem) return

    const { menuItem, portionSize } = customizingItem
    let displayText = menuItem.name
    if (portionSize) displayText = `${portionSize} ${menuItem.name}`

    const cartItemId = `${menuItem.id}${portionSize ? `-${portionSize}` : ""}${
      customizationNotes ? `-${customizationNotes}` : ""
    }`

    addToCart(menuItem, 1, {
      id: cartItemId,
      portionSize,
      customization: customizationNotes,
    })

    toast({
      title: "Added to Order",
      description: displayText + (customizationNotes ? ` (${customizationNotes})` : ""),
      duration: 500,
    })

    setIsCustomizing(false)
    setCustomizingItem(null)
    setCustomizationNotes("")
  }

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      toast({ title: "Empty Order", description: "Please add items to place an order", variant: "destructive" })
      return
    }

    const orderData = {
      items: cart,
      table_number: selectedTable?.number,
      order_type: "dine-in" as const,
      subtotal: getCartTotal(),
      tax: getCartTotal() * 0.16,
      total: getCartTotal() * 1.16,
      status: "pending" as const,
    }

    if (editingOrderId) {
      updateOrder(editingOrderId, orderData)
      toast({ title: "Order Updated!", description: `Order for Table ${selectedTable?.number} has been updated.` })
    } else {
      const order = createOrder(orderData)
      if (selectedTable) {
        setTables((prevTables) =>
          prevTables.map((t) =>
            t.id === selectedTable.id ? { ...t, status: "occupied", orderId: order.id } : t,
          ),
        )
      }
      toast({ title: "Order Placed!", description: `Order ${order.id} for Table ${selectedTable?.number} has been sent to the kitchen.` })
    }
    
    handleCloseOrderModal()
  }

  const handleTableSelect = (table: TableState) => {
    if (table.orderId) {
      setShowTableOptions(table)
    } else {
      setEditingOrderId(null)
      setSelectedTable(table)
    }
  }

  const handleAddMoreOrders = () => {
    if (showTableOptions) {
      const table = showTableOptions
      const orderToLoad = allOrders.find((o) => o.id === table.orderId)
      if (orderToLoad) {
        const cartItemsToLoad: CartItem[] = orderToLoad.items
          .map((item) => {
            const menuItem = menuItems.find((mi) => mi.id === item.menu_item_id)
            if (!menuItem) return undefined
            return {
              id: item.id,
              menu_item_id: menuItem.id,
              name: menuItem.name,
              type: menuItem.type,
              unit_price: item.price,
              quantity: item.quantity,
              total_price: item.price * item.quantity,
              unit: menuItem.unit,
              portionSize: item.portionSize,
              customization: item.customization,
              total_nutrition: {
                calories: menuItem.nutrition.calories * item.quantity,
                protein: menuItem.nutrition.protein * item.quantity,
                carbs: menuItem.nutrition.carbs * item.quantity,
                fat: menuItem.nutrition.fat * item.quantity,
                fiber: menuItem.nutrition.fiber * item.quantity,
                sodium: menuItem.nutrition.sodium * item.quantity,
              },
              inventory_deduction: menuItem.inventory_deduction
                ? {
                    ingredient_id: menuItem.inventory_deduction.ingredient_id,
                    quantity_to_deduct: menuItem.inventory_deduction.quantity_per_unit * item.quantity,
                  }
                : undefined,
            } as CartItem
          })
          .filter((item): item is CartItem => item !== undefined)
        loadCart(cartItemsToLoad)
      }
      setSelectedTable(table)
      setShowTableOptions(null)
    }
  }

  const handleProceedToPayment = () => {
    if (showTableOptions && showTableOptions.orderId) {
      setShowPayment({ table: showTableOptions, orderId: showTableOptions.orderId })
      setShowTableOptions(null)
    }
  }

  const handleMarkAsPaid = () => {
    if (showPayment) {
      updateOrderStatus(showPayment.orderId, "completed")
      setTables((prev) =>
        prev.map((t) =>
          t.id === showPayment.table.id ? { ...t, status: "available", orderId: undefined } : t
        )
      )
      toast({ title: "Payment Complete", description: `Table ${showPayment.table.number} is now available.` })
      setShowPayment(null)
    }
  }

  const handleCloseOrderModal = () => {
    clearCart()
    setSelectedTable(null)
    setEditingOrderId(null)
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <UtensilsCrossed className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold">Restaurant POS</h1>
            </div>
            <div className="text-sm text-muted-foreground">
            {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
            {currentTime.toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4 mr-2" />
              Order History
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-muted/20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tables.map((table) => {
            const order = allOrders.find((o) => o.id === table.orderId)
            return (
            <Card 
              key={table.id}
              onClick={() => handleTableSelect(table)}
                className={`cursor-pointer group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 ${
                  table.status === "occupied"
                    ? "border-primary/50 bg-primary/5 dark:bg-primary/10"
                    : "border-transparent bg-card"
                }`}
              >
                <CardContent className="p-4 flex flex-col justify-between aspect-[3/4]">
                  <div>
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-bold text-foreground">{table.number}</h3>
                <Badge 
                        variant={table.status === "occupied" ? "default" : "secondary"}
                        className={`capitalize transition-colors duration-300 ${
                          table.status === "occupied"
                            ? "bg-primary text-primary-foreground"
                            : "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100"
                  }`}
                >
                  {table.status}
                </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {table.status === "occupied" ? (
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4" />
                          <span>{order ? `Order #${order.id.slice(-4)}` : "In Progress..."}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>Available</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {table.status === "occupied" && order ? (
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground">Total Due</p>
                        <p className="text-2xl font-bold text-primary">${order.total.toFixed(2)}</p>
                      </div>
                    ) : (
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-sm text-muted-foreground">Click to start order</p>
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      </div>

      <Dialog open={!!showTableOptions} onOpenChange={(open) => !open && setShowTableOptions(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Table {showTableOptions?.number} Options</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <Button size="lg" className="w-full" onClick={handleAddMoreOrders}>
              <Plus className="h-5 w-5 mr-2" /> Add More Orders
            </Button>
            <Button size="lg" className="w-full" variant="secondary" onClick={handleProceedToPayment}>
              <CheckCircle className="h-5 w-5 mr-2" /> Proceed to Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showPayment} onOpenChange={(open) => !open && setShowPayment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment for Table {showPayment?.table.number}</DialogTitle>
          </DialogHeader>
          {showPayment && (
            <div className="space-y-4">
              {(() => {
                const order = allOrders.find((o) => o.id === showPayment.orderId)
                if (!order) return <div>Order not found.</div>
                return (
                  <>
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Order Total:</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.name}{item.portionSize && ` (${item.portionSize})`}</span>
                          <span>x{item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
              <Button className="w-full mt-4" onClick={handleMarkAsPaid}>
                <CheckCircle className="h-5 w-5 mr-2" /> Mark as Paid
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTable} onOpenChange={(isOpen) => !isOpen && handleCloseOrderModal()}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>
              {editingOrderId ? `Editing Order for Table ${selectedTable?.number}` : `New Order for Table ${selectedTable?.number}`}
            </DialogTitle>
          </DialogHeader>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 p-4 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                        placeholder="Search menu items..."
                        className="pl-10 w-96"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
              </div>
            </div>
          </div>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-muted/20">
                {/* Render grouped menu by category and subcategory */}
                <div>
                  {Object.entries(filteredGroupedMenu).map(([category, subcats]) => (
                    <div key={category} className="mb-8">
                      <h2 className="text-xl font-bold mb-2">{category}</h2>
                      {Object.entries(subcats).map(([subcat, items]) => (
                        <div key={subcat} className="mb-4">
                          {subcat !== "__no_sub__" && (
                            <h3 className="text-lg font-semibold mb-1">{subcat}</h3>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {items.map(item => (
                              <Card
                                key={item.id}
                                className="overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:border-primary/70 border-2 border-transparent rounded-2xl bg-white dark:bg-card relative"
                              >
                                <CardContent className="p-0">
                                  <div className="aspect-[4/3] bg-muted relative rounded-t-2xl overflow-hidden">
                                    {item.image ? (
                                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                                    ) : (
                                      <div className="flex items-center justify-center h-full text-4xl text-muted-foreground/30">
                                        🍽️
                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                    <h3 className="absolute bottom-2 left-3 font-bold text-white text-lg drop-shadow-lg">
                                      {item.name}
                                    </h3>
                                    <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                                      {`${Math.floor(item.available_quantity)} left`}
                          </Badge>
                        </div>
                                  <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-xl text-primary">${item.price.toFixed(2)}</span>
                                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-[120px] text-right">{item.description}</p>
                          </div>
                          <Button
                            size="sm"
                                      className="w-full rounded-full"
                                      onClick={() => handleOpenCustomization(item)}
                            disabled={item.available_quantity === 0}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                                      Add to Order
                          </Button>
                      </div>
                    </CardContent>
                  </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                ))}
              </div>
          </div>
        </div>
            <div className="w-[380px] border-l border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                  Current Order ({getCartItemCount()})
              </h2>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="font-medium">No items in order</p>
                    <p className="text-sm">Select items from the menu to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                    {cart.map((item: CartItem) => (
                      <div key={item.id} className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            {item.portionSize && (
                              <p className="text-xs text-muted-foreground capitalize">{item.portionSize}</p>
                            )}
                        </div>
                          <span className="font-medium text-sm">${item.total_price.toFixed(2)}</span>
                        </div>
                        {item.customization && (
                          <p className="text-xs text-primary/80 bg-primary/10 p-1.5 rounded-md my-2">
                            {item.customization}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-5 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                ))}
              </div>
            )}
          </div>
          {cart.length > 0 && (
                <div className="border-t border-border p-4 space-y-4 bg-muted/30">
                  <div className="flex justify-between font-semibold">
                    <span>Subtotal:</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax (16%):</span>
                    <span>${(getCartTotal() * 0.16).toFixed(2)}</span>
                  </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                    <span>${(getCartTotal() * 1.16).toFixed(2)}</span>
                </div>
                  <Button className="w-full" size="lg" onClick={handlePlaceOrder}>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {editingOrderId ? "Update Order" : "Place Order"}
              </Button>
            </div>
          )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize Item</DialogTitle>
          </DialogHeader>
          {customizingItem && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{customizingItem.menuItem.name}</h3>
                {customizingItem.portionSize && (
                  <p className="text-sm text-muted-foreground capitalize">{customizingItem.portionSize}</p>
                )}
              </div>
              <Textarea
                placeholder="e.g., No onions, extra spicy..."
                value={customizationNotes}
                onChange={(e) => setCustomizationNotes(e.target.value)}
                rows={4}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCustomizing(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAddToCart}>Add to Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        {/* ... history content ... */}
      </Dialog>
      </div>
  )
}
