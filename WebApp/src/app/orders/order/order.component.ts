import { CustomerService } from './../../shared/customer.service';
import { OrderService } from './../../shared/order.service';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { OrderItemsComponent } from '../order-items/order-items.component';
import { Customer } from 'src/app/shared/customer.model';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styles: []
})

export class OrderComponent implements OnInit {
  customerList: Customer[];
  isValid: boolean = true;
  isReadOnly:boolean = false;
  isVisible:boolean = true;


  constructor(private service: OrderService,
    private dialog: MatDialog,
    private customerService: CustomerService,
    private toastr: ToastrService,
    private router: Router,
    private currentRoute: ActivatedRoute) { }

  ngOnInit() {
    let orderID = this.currentRoute.snapshot.paramMap.get('id');
    if (orderID == null)
      this.resetForm();
    else {
      this.service.getOrderByID(parseInt(orderID)).then(res => {
        this.service.formData = res.order;
        this.service.orderItems = res.orderDetails;
        this.service.formData.DeletedOrderItemIDs="";
        this.findCustomerName();
      });
    }
    this.customerService.getCustomerList().then(res => this.customerList = res as Customer[]);
  }

  resetForm(form?: NgForm) {
    if (form = null)
      form.resetForm();
    this.service.formData = {
      OrderID: null,
      OrderNo: Math.floor(100000 + Math.random() * 900000).toString(),
      Name: '',
      Mobile:null,
      PMethod: '',
      GTotal: 0,
      DeletedOrderItemIDs: ''
    };
    this.service.orderItems = [];
  }

  AddOrEditOrderItem(orderItemIndex, OrderID) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.disableClose = true;
    dialogConfig.width = "50%";
    dialogConfig.data = { orderItemIndex, OrderID };
    this.dialog.open(OrderItemsComponent, dialogConfig).afterClosed().subscribe(res => {
      this.updateGrandTotal();
    });
  }


  onDeleteOrderItem(orderItemID: number, i: number) {
    if (orderItemID != null)
      this.service.formData.DeletedOrderItemIDs += orderItemID + ",";
    this.service.orderItems.splice(i, 1);
    this.updateGrandTotal();
  }

  updateGrandTotal() {
    this.service.formData.GTotal = this.service.orderItems.reduce((prev, curr) => {
      return prev + curr.Total;
    }, 0);
    this.service.formData.GTotal = parseFloat(this.service.formData.GTotal.toFixed(2));
  }

  findCustomerName() {
    if (this.customerList!=null){
      for(let customer of this.customerList){
        if(this.service.formData.Mobile == customer.Mobile){
          this.service.formData.Name = customer.Name;
          this.isReadOnly = true;
          this.isVisible = true;
          break;
        }
        else
          this.isVisible= false;
      }
    }
  } 

  addNewCustomer(){
    if(this.service.formData.Name != null && this.service.formData.Mobile != null)
    {
      this.service.addCustomer(this.service.formData.Mobile,this.service.formData.Name).subscribe(res=>{
        this.toastr.success('Added Customer Successfully', 'Restaurent App.');
      });
      this.isVisible=true;
      this.isReadOnly=true;
    }
  }
  
  onSearchChange(searchedValue : string){
    this.service.formData.Name = '',
    this.isReadOnly = false;
  }

  validateForm() {
    this.isValid = true;
    if (this.service.formData.Mobile == 0)
      this.isValid = false;
    else if (this.service.orderItems.length == 0)
      this.isValid = false;
    return this.isValid;
  }


  onSubmit(form: NgForm) {
    if (this.validateForm()) {
      this.service.saveOrUpdateOrder().subscribe(res => {
        this.resetForm();
        this.toastr.success('Submitted Successfully', 'Restaurent App.');
        this.router.navigate(['/orders']);
      })
    }
  }

}
