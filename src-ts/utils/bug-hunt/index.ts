import { currencyFormat } from '../../../src/utils'
import { FormCard } from '../../lib'
import BugHuntPricingConfig from '../../tools/work/work-self-service/intake-forms/bug-hunt/bug-hunt.form.pricing-config'

function getSelectedPackageFormatted(packageId: string): string {
  const currentPackage: FormCard | undefined = BugHuntPricingConfig.find((pricingConfig) => pricingConfig.id === packageId)
  if (currentPackage) {
    const deviceType: string = currentPackage.sections?.[0]?.rows?.[3]?.text || ''
    const noOfTesters: string = `${currentPackage.sections?.[0]?.rows?.[2]?.text || 0} testers`
    return `${currentPackage.title} - ${currencyFormat(currentPackage.price)} - ${deviceType} - ${noOfTesters}`
  }

  return packageId
}

export default getSelectedPackageFormatted
