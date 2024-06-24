import { Component, OnInit } from '@angular/core'
import { environment } from '../../../../../../../../../src/environments/environment'
import { ActivatedRoute } from '@angular/router'

@Component({
  selector: 'ws-app-kcm-mapping',
  templateUrl: './kcm-mapping.component.html',
  styleUrls: ['./kcm-mapping.component.scss'],
})
export class KCMMappingComponent implements OnInit {
  environmentVal: any
  taxonomyConfig: any
  showTopSection = true
  kcmConfig: any
  constructor(
    private activateRoute: ActivatedRoute
  ) { }

  ngOnInit() {
    this.environmentVal = environment
    this.environmentVal.frameworkName = 'cats_fw'
    this.environmentVal.channelId = '0132245461338112000',
      this.activateRoute.data.subscribe(data => {
        this.kcmConfig = data.pageData.data
        this.taxonomyConfig = this.kcmConfig.frameworkConfig
        console.log('kcmConfig', this.kcmConfig)
      })
  }

}