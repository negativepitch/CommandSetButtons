import { BaseDialog, IDialogConfiguration } from '@microsoft/sp-dialog';

export default class CustomDialog extends BaseDialog {  
    public itemUrlFromExtension: string;  
    public otherParam: string;  
    public paramFromDailog:string;  
      
    
    public render(): void {
        console.log(":: Dialog render ::")
        var html:string = "";  
        html +=  `<div style="padding: 10px;">
                    <h1>Hello, I am custom Dailog Box....</h1>
                    <input type="button" id="OkButton"  value="Submit">
                </div>`;  
        this.domElement.innerHTML = html;
        this._setButtonEventHandlers();
    }  
    
      // METHOD TO BIND EVENT HANDLER TO BUTTON CLICK  
        private _setButtonEventHandlers(): void {      
            this.domElement.querySelector('#OkButton').addEventListener('click', () => {
                this.close();
            });
        }

        public getConfig(): IDialogConfiguration {
            return { isBlocking: false };
        }
      
    protected onAfterClose(): void {
        this.domElement.remove();
        super.onAfterClose();
    }  
    
  }  