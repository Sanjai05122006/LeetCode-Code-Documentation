# Two Sum

**Problem Link:** https://leetcode.com/problems/two-sum/

**Language:** Java

**Topics:** Array, Hash Table

---

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        // int [] result=new int[2];

        // for(int i=0;i<nums.length;i++){
        //     for(int j=i+1;j<nums.length;j++){
        //         if(target-nums[i]==nums[j]){
        //             result[0]=i;
        //             result[1]=j;
        //             break;
        //         }
        //     }
        // }
        

        // return result;

        // int [] ans=new int[2];

        // int left=0;
        // int right=nums.length-1;
        // while(left<=right){
        //     if(nums[left]+nums[right]>target){
        //         right--;
        //     }
        //     else if(nums[left]+nums[right]<target){
        //         left++;
        //     }
            
        // }
        // System.out.println(right);
        // return ans;
       
        Map <Integer,Integer> map=new  HashMap<>();
        int idx=0;
        for(int i:nums){
            map.put(i,idx++);
        }
        for(int i=0;i<nums.length;i++){
            int tarToBeSearched=target-nums[i];
            if(map.containsKey(tarToBeSearched) && i!=map.get(tarToBeSearched)){
                return new int []{i,map.get(tarToBeSearched)};
            }
        }

        return new int []{};
    }
}
```
