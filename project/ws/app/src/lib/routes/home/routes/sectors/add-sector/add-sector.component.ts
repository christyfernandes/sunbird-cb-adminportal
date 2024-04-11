import { Component, OnInit } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { MatDialog, MatDialogConfig } from '@angular/material/dialog'
import { ActivatedRoute, Router } from '@angular/router'
import * as _ from 'lodash'
import { AddThumbnailComponent } from '../../add-thumbnail/add-thumbnail.component'
import { ImageCropComponent } from '../../image-crop/image-crop.component'
import { environment } from '../../../../../../../../../../src/environments/environment'
import { MatSnackBar } from '@angular/material/snack-bar'
import { SectorsService } from '../sectors.service'
import { DomSanitizer } from '@angular/platform-browser'

@Component({
  selector: 'ws-app-add-sector',
  templateUrl: './add-sector.component.html',
  styleUrls: ['./add-sector.component.scss'],
})
export class AddSectorComponent implements OnInit {

  currentUser!: string | null
  addSectorForm: FormGroup
  disableCreateButton = false
  myreg = /^[a-zA-Z0-9.\-_$/:[\]' '!]+$/
  aspectRatio = 1 / 2

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private snackbar: MatSnackBar,
    private sectorsService: SectorsService,
    private activatedRoute: ActivatedRoute,
    private sanitizer: DomSanitizer,
  ) {
    this.currentUser = _.get(this.activatedRoute, 'snapshot.parent.data.configService.userProfile.userId')
    this.addSectorForm = new FormGroup({
      sectorTitle: new FormControl('', [Validators.required, Validators.pattern(this.myreg)]),
      appIcon: new FormControl('', [Validators.required]),
    })
  }

  ngOnInit() {

  }

  goToList() {
    this.router.navigateByUrl('/app/home/sectors')
  }

  onSubmit() {

  }

  generateUrl(oldUrl: string) {
    const chunk = oldUrl ? oldUrl.split('/') : []
    const newChunk = environment.contentBucket.split('/')
    const newLink = []
    for (let i = 0; i < chunk.length; i += 1) {
      if (i === 2) {
        newLink.push(newChunk[i])
      } else if (i === 3) {
        newLink.push(environment.contentBucket)
      } else {
        newLink.push(chunk[i])
      }
    }
    const newUrl = newLink.join('/')
    return newUrl
  }

  openDialog() {
    const dialogConfig = new MatDialogConfig()
    const dialogRef = this.dialog.open(AddThumbnailComponent, dialogConfig)
    dialogRef.afterClosed().subscribe(data => {
      if (data && data.appURL) {
        this.addSectorForm.patchValue({
          appIcon: this.generateUrl(data.appURL),
        })
      } else if (data && data.file) {
        this.uploadAppIcon(data.file)
      }
    })
  }

  uploadAppIcon(file: File) {
    if (!file) {
      return
    }
    const formdata = new FormData()
    const fileName = file.name

    if (
      !(
        ['.png', '.jpg', '.jpeg'].indexOf(
          `.${fileName
            .toLowerCase()
            .split('.')
            .pop()}`,
        ) > -1
      )
    ) {
      return
    }

    if (file.size > (1 * 1024 * 1024)) {
      this.snackbar.open('Size is greater than allowed.')
      return
    }

    const dialogRef = this.dialog.open(ImageCropComponent, {
      width: '70%',
      data: {
        isRoundCrop: false,
        imageFile: file,
        width: 24,
        height: 24,
        isThumbnail: true,
        imageFileName: fileName,
      },
    })

    dialogRef.afterClosed().subscribe({
      next: (result: File) => {
        if (result) {
          formdata.append('content', result, fileName)
          let randomNumber = ''
          // tslint:disable-next-line: no-increment-decrement
          for (let i = 0; i < 16; i++) {
            randomNumber += Math.floor(Math.random() * 10)
          }

          const requestBody = {
            request: {
              content: {
                code: randomNumber,
                contentType: 'Asset',
                createdBy: this.currentUser,
                creator: this.currentUser,
                mimeType: 'image/png',
                mediaType: 'image',
                name: fileName,
                language: ['English'],
                license: 'CC BY 4.0',
                primaryCategory: 'Asset',
              },
            },
          }
          this.sectorsService.createImageContent(requestBody).subscribe((res: any) => {
            this.sectorsService
              .upload(formdata, {
                contentId: res.result.identifier,
                contentType: this.sectorsService.CONTENT_BASE_STATIC,
              }).subscribe((data: any) => {
                if (data.result) {
                  this.addSectorForm.controls.appIcon.setValue(this.generateUrl(data.result.artifactUrl))
                }
              })
          })
        }
      },
    })
  }

  getUrl(url: string) {
    if (this.sectorsService.getChangedArtifactUrl(url)) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(this.sectorsService.getChangedArtifactUrl(url))
    }
    return '/assets/instances/eagle/app_logos/default.png'
  }
}
