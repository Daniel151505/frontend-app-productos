import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { Product } from 'src/app/interfaces/Product';
import { ProductService } from 'src/app/services/product.service';
import { ConfirmationModalService } from 'src/app/shared/components/confirmation-modal/confirmation-modal.service';
import { LoaderService } from 'src/app/shared/components/loader/loader.service';
import { ProductDetailComponent } from '../product-detail/product-detail.component';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {

  public listProductType: string[] = ['Todos los productos', 'Productos que deseo', "Productos que no deseo"]
  public type = 'Todos los productos';
  public products: Product[] = [] ;
  public productLength: number = 0;

  lowValue: number = 0;
  highValue: number = 5;
  pageSize:number = 8;
  pageNumber:number = 1;
  pageSizeOptions: number[] = [8,10,20,50,100]

  constructor(
    private productService: ProductService,
    public dialog: MatDialog,
    public loaderService: LoaderService,
    private $confirm: ConfirmationModalService
  )
  { }

  ngOnInit(): void {
    this.filter()
  }

  filter () {
    this.getProducts(this.type);
  }

  getProducts(type?: string): void {
    this.loaderService.show();
    this.productService.getProducts()
      .pipe(
        finalize(() => this.loaderService.hide())
      )
      .subscribe( res => {
        const allProducts = res;

        if (this.type === 'Todos los productos') {
          this.products = allProducts;
        }
        if (this.type === 'Productos que deseo'){
          this.products = allProducts.filter(value => value.choose === true);
        }
        if (this.type === 'Productos que no deseo'){
          this.products = allProducts.filter(value => value.choose === false);
        }


        this.products.sort((a,b) => {
          const dateA = a.createdAt
          const dateB = b.createdAt

          if(dateA! < dateB!) return 1;
          else if(dateA! > dateB!) return -1
          return 0;
        })

        this.productLength = this.products.length;
      }
      )
  }

  openProductDetail(id?: string ) {
    const dialogRef = this.dialog.open(ProductDetailComponent, {
      width: '50rem',
      data: id,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe( (res) => {
      if(res) {
        if(res.data !== false) {
          this.getProducts();
        }
      }
    })
  }

  deleteProduct(id?: string) {
    this.$confirm
      .confirmar({
        title: '¿Estas seguro de eliminar el producto?',
        message: `Una vez eliminado no podras recuperarlo`
      }).subscribe( (respuesta) => {
        if (respuesta) {
          this.productService.deleteProduct( id )
            .subscribe(
              () => {
                this.getProducts();
              },
              err => console.log(err)
            )
        }
      });
  }

  chooseProduct(id?:string, product?: any) {
    this.$confirm
      .confirmar({
        title: '¿Quieres agregar este producto a tu lista de deseos?',
        message: `Si agregas este producto figurara en tu lista de deseos`
      }).subscribe( (respuesta) => {
        if (respuesta) {
          product.choose = true;
          this.productService.updateProduct(id, product)
            .subscribe(
              () => {
                this.getProducts();
              },
              err => console.log(err)
            )
        }
      });
  }

  dontChooseProduct(id?:string, product?: any) {
    this.$confirm
      .confirmar({
        title: '¿Quieres quitar este producto de tu lista de deseos?',
        message: `Si quitas este producto ya no figurara en tu lista de deseos`
      }).subscribe( (respuesta) => {
        if (respuesta) {
          product.choose = false;
          this.productService.updateProduct(id, product)
            .subscribe(
              () => {
                this.getProducts();
              },
              err => console.log(err)
            )
        }
      });
  }

  public getPaginatorData(event: PageEvent) {
    this.lowValue = event.pageIndex * event.pageSize;
    this.highValue = this.lowValue + event.pageSize;
  }

  handlePage(e: PageEvent) {
    this.pageSize = e.pageSize;
    this.pageNumber = e.pageIndex + 1;
  }

}
